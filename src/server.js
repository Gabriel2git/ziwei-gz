const http = require('http');
const path = require('path');
const iztro = require('iztro');
const RetrievalService = require('../backend/services/retrievalService');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

const port = 3001;
const CURRENT_BASELINE_YEAR = 2026;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MID_YEAR_ANCHOR = '06-30';
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_SIZE = 300;

console.log('=== Server Start ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AUTH_CODE exists:', !!process.env.AUTH_CODE);

const retrievalService = new RetrievalService();
retrievalService.initialize().catch(console.error);

class TTLCache {
  constructor(maxSize = CACHE_MAX_SIZE, ttlMs = CACHE_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }
}

const astrolabeCache = new TTLCache();
const litePayloadCache = new TTLCache();
const contextPayloadCache = new TTLCache();

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getCacheValue(cache, key) {
  return cache.get(key);
}

function setCacheValue(cache, key, value) {
  cache.set(key, value);
}

function getHoroscopeForYear(astrolabe, year) {
  return astrolabe.horoscope(`${year}-${MID_YEAR_ANCHOR}`);
}

function normalizeZiweiInput(body) {
  const birthday = typeof body?.birthday === 'string' ? body.birthday : '';
  const hourIndex = Number(body?.hourIndex);
  const gender = typeof body?.gender === 'string' ? body.gender : '';
  const isLunar = Boolean(body?.isLunar);
  const isLeap = Boolean(body?.isLeap);
  const targetYear = body?.targetYear;

  if (!birthday || Number.isNaN(hourIndex) || !gender) {
    return { error: 'Missing required parameters' };
  }

  const normalizedTargetYear = targetYear === undefined ? new Date().getFullYear() : Number(targetYear);
  if (
    !Number.isInteger(normalizedTargetYear) ||
    normalizedTargetYear < MIN_YEAR ||
    normalizedTargetYear > MAX_YEAR
  ) {
    return { error: `targetYear must be an integer between ${MIN_YEAR} and ${MAX_YEAR}` };
  }

  return {
    input: {
      birthday,
      hourIndex,
      gender,
      isLunar,
      isLeap,
      normalizedTargetYear,
    },
  };
}

function getAstrolabeKey(input) {
  return [
    input.birthday,
    input.hourIndex,
    input.gender,
    input.isLunar ? 1 : 0,
    input.isLeap ? 1 : 0,
    'zh-CN',
  ].join('|');
}

function getYearKey(input, targetYear) {
  return `${getAstrolabeKey(input)}|${targetYear}|${MID_YEAR_ANCHOR}`;
}

function getOrCreateAstrolabe(input) {
  const key = getAstrolabeKey(input);
  const cached = getCacheValue(astrolabeCache, key);
  if (cached) {
    return cached;
  }

  const astrolabe = input.isLunar
    ? iztro.astro.byLunar(input.birthday, input.hourIndex, input.gender, input.isLeap, true, 'zh-CN')
    : iztro.astro.bySolar(input.birthday, input.hourIndex, input.gender, true, 'zh-CN');

  setCacheValue(astrolabeCache, key, astrolabe);
  return astrolabe;
}

function safeJsonStringify(payload) {
  const seen = new WeakSet();
  try {
    return JSON.stringify(payload, (key, value) => {
      if (typeof value === 'function') {
        return undefined;
      }
      if (value && typeof value === 'object') {
        if (seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    console.error('[safe_json_stringify_error]', error);
    return JSON.stringify({ error: 'serialization_failed' });
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(safeJsonStringify(payload));
}

function pickPrimitiveFields(source, keys) {
  const output = {};
  if (!source || typeof source !== 'object') return output;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && (value === null || ['string', 'number', 'boolean'].includes(typeof value))) {
      output[key] = value;
    }
  }
  return output;
}

function serializeStar(star) {
  if (!star || typeof star !== 'object') return undefined;
  const output = pickPrimitiveFields(star, ['name', 'brightness', 'mutagen', 'type', 'scope']);
  return Object.keys(output).length ? output : undefined;
}

function serializeStars(stars) {
  if (!Array.isArray(stars)) return [];
  return stars.map((star) => serializeStar(star)).filter(Boolean);
}

function serializeDecadal(decadal) {
  if (!decadal || typeof decadal !== 'object') return undefined;
  const output = pickPrimitiveFields(decadal, ['heavenlyStem', 'earthlyBranch']);
  if (Array.isArray(decadal.range) && decadal.range.length === 2) {
    output.range = [decadal.range[0], decadal.range[1]];
  }
  if (Array.isArray(decadal.mutagen)) {
    output.mutagen = decadal.mutagen.filter((item) => typeof item === 'string');
  }
  return Object.keys(output).length ? output : undefined;
}

function serializePalace(palace) {
  if (!palace || typeof palace !== 'object') return undefined;
  const output = pickPrimitiveFields(palace, [
    'index',
    'name',
    'isBodyPalace',
    'isOriginalPalace',
    'heavenlyStem',
    'earthlyBranch',
    'changsheng12',
    'boshi12',
    'jiangqian12',
    'suiqian12',
  ]);

  output.majorStars = serializeStars(palace.majorStars);
  output.minorStars = serializeStars(palace.minorStars);
  output.adjectiveStars = serializeStars(palace.adjectiveStars);

  const decadal = serializeDecadal(palace.decadal);
  if (decadal) output.decadal = decadal;

  if (Array.isArray(palace.ages)) {
    output.ages = palace.ages.filter((age) => typeof age === 'number');
  }

  return output;
}

function serializeAstrolabe(astrolabe) {
  if (!astrolabe || typeof astrolabe !== 'object') return {};
  const output = pickPrimitiveFields(astrolabe, [
    'gender',
    'solarDate',
    'lunarDate',
    'chineseDate',
    'time',
    'timeRange',
    'sign',
    'zodiac',
    'earthlyBranchOfBodyPalace',
    'earthlyBranchOfSoulPalace',
    'soul',
    'body',
    'fiveElementsClass',
    'copyright',
  ]);

  output.palaces = Array.isArray(astrolabe.palaces)
    ? astrolabe.palaces.map((palace) => serializePalace(palace)).filter(Boolean)
    : [];

  return output;
}

function serializeHoroscopeSection(section) {
  if (!section || typeof section !== 'object') return undefined;

  const output = {};
  for (const [key, value] of Object.entries(section)) {
    if (key === 'astrolabe' || typeof value === 'function' || value === undefined) {
      continue;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      output[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
      output[key] = value;
    }
  }

  return Object.keys(output).length ? output : undefined;
}

function serializeAge(age) {
  if (!age || typeof age !== 'object') return undefined;
  const output = {};
  for (const [key, value] of Object.entries(age)) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      output[key] = value;
    }
  }
  return Object.keys(output).length ? output : undefined;
}

function serializeHoroscope(horoscope) {
  if (!horoscope || typeof horoscope !== 'object') return {};
  const output = pickPrimitiveFields(horoscope, ['lunarDate', 'solarDate']);

  output.age = serializeAge(horoscope.age);
  output.decadal = serializeHoroscopeSection(horoscope.decadal);
  output.yearly = serializeHoroscopeSection(horoscope.yearly);
  output.monthly = serializeHoroscopeSection(horoscope.monthly);
  output.daily = serializeHoroscopeSection(horoscope.daily);
  output.hourly = serializeHoroscopeSection(horoscope.hourly);

  return output;
}

function getLifePalaceGanzhiFromHoroscope(astrolabe, horoscope) {
  const yearlyPalaceNames = horoscope?.yearly?.palaceNames;
  if (!Array.isArray(yearlyPalaceNames)) return '';
  const lifePalaceIndex = yearlyPalaceNames.indexOf('命宫');
  if (lifePalaceIndex < 0) return '';
  const palace = astrolabe?.palaces?.[lifePalaceIndex];
  if (!palace) return '';
  return `${palace.heavenlyStem || ''}${palace.earthlyBranch || ''}`;
}

function getCurrentDecadalRange(astrolabe, horoscope) {
  const decadalBranch = horoscope?.decadal?.earthlyBranch;
  const decadalPalace = astrolabe?.palaces?.find((palace) => palace.earthlyBranch === decadalBranch);
  return decadalPalace?.decadal?.range;
}

function buildDecadalYearlyInfo(astrolabe, targetYear, horoscope) {
  const nominalAge = horoscope?.age?.nominalAge;
  const range = getCurrentDecadalRange(astrolabe, horoscope);
  if (!Array.isArray(range) || range.length !== 2 || typeof nominalAge !== 'number') {
    return null;
  }

  const [startAge, endAge] = range;
  const startYear = targetYear - (nominalAge - startAge);
  const endYear = startYear + (endAge - startAge);
  const years = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const yearlyHoroscope = getHoroscopeForYear(astrolabe, year);
    years.push({
      year,
      yearGanzhi: `${yearlyHoroscope?.yearly?.heavenlyStem || ''}${yearlyHoroscope?.yearly?.earthlyBranch || ''}`,
      nominalAge: yearlyHoroscope?.age?.nominalAge ?? null,
      lifePalaceGanzhi: getLifePalaceGanzhiFromHoroscope(astrolabe, yearlyHoroscope),
      yearlyMutagen: yearlyHoroscope?.yearly?.mutagen || [],
      decadalMutagen: yearlyHoroscope?.decadal?.mutagen || [],
      decadalEarthlyBranch: yearlyHoroscope?.decadal?.earthlyBranch || '',
      yearlyEarthlyBranch: yearlyHoroscope?.yearly?.earthlyBranch || '',
      overlap:
        yearlyHoroscope?.decadal?.earthlyBranch === yearlyHoroscope?.yearly?.earthlyBranch ? '同宫' : '无',
    });
  }

  return {
    range: [startYear, endYear],
    ageRange: [startAge, endAge],
    years,
  };
}

function sortPalacesByDecadal(astrolabe) {
  if (!Array.isArray(astrolabe?.palaces)) return [];
  return astrolabe.palaces
    .filter((palace) => Array.isArray(palace?.decadal?.range))
    .map((palace) => ({
      palace,
      startAge: Number(palace.decadal.range[0]),
      endAge: Number(palace.decadal.range[1]),
    }))
    .sort((a, b) => a.startAge - b.startAge);
}

function buildPromptDecadalBlocks(astrolabe, referenceYear, referenceHoroscope, blockCount = 6) {
  const nominalAge = referenceHoroscope?.age?.nominalAge;
  if (typeof nominalAge !== 'number') return [];

  const sorted = sortPalacesByDecadal(astrolabe).slice(0, blockCount);
  return sorted.map((item, index) => {
    const { palace, startAge, endAge } = item;
    const startYear = referenceYear - (nominalAge - startAge);
    const endYear = startYear + (endAge - startAge);
    const years = [];

    for (let year = startYear; year <= endYear; year += 1) {
      const yearlyHoroscope = getHoroscopeForYear(astrolabe, year);
      years.push({
        year,
        yearGanzhi: `${yearlyHoroscope?.yearly?.heavenlyStem || ''}${yearlyHoroscope?.yearly?.earthlyBranch || ''}`,
        nominalAge: yearlyHoroscope?.age?.nominalAge ?? null,
        lifePalaceGanzhi: getLifePalaceGanzhiFromHoroscope(astrolabe, yearlyHoroscope),
        yearlyMutagen: yearlyHoroscope?.yearly?.mutagen || [],
      });
    }

    const firstYearHoroscope = getHoroscopeForYear(astrolabe, startYear);

    return {
      index: index + 1,
      decadalGanzhi: `${palace?.heavenlyStem || ''}${palace?.earthlyBranch || ''}`,
      decadalRange: [startAge, endAge],
      yearRange: [startYear, endYear],
      decadalMutagen: firstYearHoroscope?.decadal?.mutagen || [],
      years,
    };
  });
}

function buildSelectedContext(targetYear, horoscope, astrolabe) {
  const decadalBranch = horoscope?.decadal?.earthlyBranch || '';
  const decadalPalace = astrolabe?.palaces?.find((palace) => palace.earthlyBranch === decadalBranch);
  const decadalRange = Array.isArray(decadalPalace?.decadal?.range) ? decadalPalace.decadal.range : [];

  return {
    baselineYear: CURRENT_BASELINE_YEAR,
    targetYear,
    nominalAge: horoscope?.age?.nominalAge ?? null,
    decadal: {
      heavenlyStem: horoscope?.decadal?.heavenlyStem || '',
      earthlyBranch: decadalBranch,
      range: decadalRange,
      mutagen: horoscope?.decadal?.mutagen || [],
    },
    yearly: {
      heavenlyStem: horoscope?.yearly?.heavenlyStem || '',
      earthlyBranch: horoscope?.yearly?.earthlyBranch || '',
      mutagen: horoscope?.yearly?.mutagen || [],
    },
  };
}

function buildLitePayload(astrolabeRaw, targetYear, horoscopeRaw) {
  const horoscope = horoscopeRaw || getHoroscopeForYear(astrolabeRaw, targetYear);
  return {
    astrolabe: serializeAstrolabe(astrolabeRaw),
    horoscope: serializeHoroscope(horoscope),
    targetYear,
    selectedContext: buildSelectedContext(targetYear, horoscope, astrolabeRaw),
  };
}

function buildContextPayload(astrolabeRaw, targetYear, horoscopeRaw) {
  const horoscope = horoscopeRaw || getHoroscopeForYear(astrolabeRaw, targetYear);
  return {
    targetYear,
    selectedContext: buildSelectedContext(targetYear, horoscope, astrolabeRaw),
    decadalYearlyInfo: buildDecadalYearlyInfo(astrolabeRaw, targetYear, horoscope),
    promptDecadalBlocks: buildPromptDecadalBlocks(astrolabeRaw, targetYear, horoscope, 6),
  };
}

function classifyZiweiError(error) {
  const message = String(error?.message || error || '');
  if (/circular structure|stringify|serialize/i.test(message)) {
    return 'serialization_error';
  }
  return 'iztro_calc_error';
}

function normalizeTargetYear(targetYear) {
  const normalizedTargetYear = targetYear === undefined ? new Date().getFullYear() : Number(targetYear);
  if (
    !Number.isInteger(normalizedTargetYear) ||
    normalizedTargetYear < MIN_YEAR ||
    normalizedTargetYear > MAX_YEAR
  ) {
    return null;
  }
  return normalizedTargetYear;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ziwei-lite') {
    try {
      const normalized = normalizeZiweiInput(await parseRequestBody(req));
      if (normalized.error) {
        sendJson(res, 400, { error: normalized.error });
        return;
      }
      const { input } = normalized;
      const targetYear = input.normalizedTargetYear;
      const yearKey = getYearKey(input, targetYear);

      const cachedLite = getCacheValue(litePayloadCache, yearKey);
      if (cachedLite) {
        sendJson(res, 200, cachedLite);
        return;
      }

      const astrolabeRaw = getOrCreateAstrolabe(input);
      const horoscopeRaw = getHoroscopeForYear(astrolabeRaw, targetYear);
      const payload = buildLitePayload(astrolabeRaw, targetYear, horoscopeRaw);
      setCacheValue(litePayloadCache, yearKey, payload);

      console.log(
        '[ziwei_lite_success]',
        JSON.stringify({
          targetYear,
          anchorDate: `${targetYear}-${MID_YEAR_ANCHOR}`,
          hasPalaces: Array.isArray(payload.astrolabe?.palaces),
          palaceCount: payload.astrolabe?.palaces?.length || 0,
          hasHoroscopeAge: typeof payload.horoscope?.age?.nominalAge === 'number',
        }),
      );

      sendJson(res, 200, payload);
    } catch (error) {
      const errorType = classifyZiweiError(error);
      console.error(`[ziwei_lite_error:${errorType}]`, error?.message || error);
      sendJson(res, 500, { error: error?.message || 'Unknown error', errorType });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ziwei-context') {
    try {
      const normalized = normalizeZiweiInput(await parseRequestBody(req));
      if (normalized.error) {
        sendJson(res, 400, { error: normalized.error });
        return;
      }
      const { input } = normalized;
      const targetYear = input.normalizedTargetYear;
      const yearKey = getYearKey(input, targetYear);

      const cachedContext = getCacheValue(contextPayloadCache, yearKey);
      if (cachedContext) {
        sendJson(res, 200, cachedContext);
        return;
      }

      const astrolabeRaw = getOrCreateAstrolabe(input);
      const horoscopeRaw = getHoroscopeForYear(astrolabeRaw, targetYear);
      const contextPayload = buildContextPayload(astrolabeRaw, targetYear, horoscopeRaw);
      setCacheValue(contextPayloadCache, yearKey, contextPayload);

      console.log(
        '[ziwei_context_success]',
        JSON.stringify({
          targetYear,
          anchorDate: `${targetYear}-${MID_YEAR_ANCHOR}`,
          promptDecadalBlocks: contextPayload.promptDecadalBlocks?.length || 0,
          hasDecadalYearlyInfo: Boolean(contextPayload.decadalYearlyInfo),
        }),
      );

      sendJson(res, 200, contextPayload);
    } catch (error) {
      const errorType = classifyZiweiError(error);
      console.error(`[ziwei_context_error:${errorType}]`, error?.message || error);
      sendJson(res, 500, { error: error?.message || 'Unknown error', errorType });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ziwei') {
    try {
      const normalized = normalizeZiweiInput(await parseRequestBody(req));
      if (normalized.error) {
        sendJson(res, 400, { error: normalized.error });
        return;
      }
      const { input } = normalized;
      const targetYear = input.normalizedTargetYear;
      const yearKey = getYearKey(input, targetYear);

      let litePayload = getCacheValue(litePayloadCache, yearKey);
      let contextPayload = getCacheValue(contextPayloadCache, yearKey);

      const astrolabeRaw = getOrCreateAstrolabe(input);
      const horoscopeRaw = getHoroscopeForYear(astrolabeRaw, targetYear);

      if (!litePayload) {
        litePayload = buildLitePayload(astrolabeRaw, targetYear, horoscopeRaw);
        setCacheValue(litePayloadCache, yearKey, litePayload);
      }

      if (!contextPayload) {
        contextPayload = buildContextPayload(astrolabeRaw, targetYear, horoscopeRaw);
        setCacheValue(contextPayloadCache, yearKey, contextPayload);
      }

      const payload = {
        ...litePayload,
        decadalYearlyInfo: contextPayload.decadalYearlyInfo,
        promptDecadalBlocks: contextPayload.promptDecadalBlocks,
      };

      console.log(
        '[ziwei_api_success]',
        JSON.stringify({
          targetYear,
          anchorDate: `${targetYear}-${MID_YEAR_ANCHOR}`,
          hasPalaces: Array.isArray(payload.astrolabe?.palaces),
          palaceCount: payload.astrolabe?.palaces?.length || 0,
          hasHoroscopeAge: typeof payload.horoscope?.age?.nominalAge === 'number',
          promptDecadalBlocks: payload.promptDecadalBlocks?.length || 0,
        }),
      );

      sendJson(res, 200, payload);
    } catch (error) {
      const errorType = classifyZiweiError(error);
      console.error(`[ziwei_api_error:${errorType}]`, error?.message || error);
      sendJson(res, 500, { error: error?.message || 'Unknown error', errorType });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag/search') {
    try {
      const body = await parseRequestBody(req);
      const { query, topK = 3 } = body;

      if (!query) {
        sendJson(res, 400, { error: 'Missing query parameter' });
        return;
      }

      const results = await retrievalService.search(query, topK);
      const context = retrievalService.buildContext(results);
      sendJson(res, 200, { results, context });
    } catch (error) {
      console.error('RAG search error:', error);
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag/test') {
    try {
      const body = await parseRequestBody(req);
      const { query, topK = 3 } = body;

      if (!query) {
        sendJson(res, 400, { error: 'Missing query parameter' });
        return;
      }

      const results = await retrievalService.search(query, topK);
      const context = retrievalService.buildContext(results);
      const prompt = `你是一位专业的紫微斗数命理师，请根据以下资料回答用户问题：\n\n${context}\n\n用户问题：${query}\n\n请提供清晰、专业、可执行的建议。`;
      sendJson(res, 200, { results, context, prompt });
    } catch (error) {
      console.error('RAG test error:', error);
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/verify-code') {
    try {
      const body = await parseRequestBody(req);
      const { code } = body;

      if (!code) {
        sendJson(res, 400, { error: '请输入邀请码' });
        return;
      }

      if (code === process.env.AUTH_CODE) {
        sendJson(res, 200, { success: true, message: '验证成功' });
      } else {
        sendJson(res, 401, { error: '邀请码错误' });
      }
    } catch (error) {
      console.error('Verify code error:', error);
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  res.statusCode = 404;
  res.end();
});

server.listen(port, () => {
  console.log(`Ziwei server running at http://localhost:${port}`);
});
