const http = require('http');
const path = require('path');
const iztro = require('iztro');
const RetrievalService = require('../backend/services/retrievalService');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

const port = 3001;

console.log('=== Server Start ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AUTH_CODE exists:', !!process.env.AUTH_CODE);

const retrievalService = new RetrievalService();
retrievalService.initialize().catch(console.error);

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
  const decadalPalace = astrolabe?.palaces?.find((p) => p.earthlyBranch === decadalBranch);
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
    const yearlyHoroscope = astrolabe.horoscope(`${year}-01-01`);
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
        yearlyHoroscope?.decadal?.earthlyBranch === yearlyHoroscope?.yearly?.earthlyBranch
          ? '同宫'
          : '无',
    });
  }

  return {
    range: [startYear, endYear],
    ageRange: [startAge, endAge],
    years,
  };
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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ziwei') {
    try {
      const body = await parseRequestBody(req);
      const { birthday, hourIndex, gender, isLunar, isLeap, targetYear } = body;

      if (!birthday || hourIndex === undefined || !gender) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing required parameters' }));
        return;
      }

      const normalizedTargetYear = targetYear === undefined ? new Date().getFullYear() : Number(targetYear);
      if (!Number.isInteger(normalizedTargetYear) || normalizedTargetYear < 1900 || normalizedTargetYear > 2100) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'targetYear must be an integer between 1900 and 2100' }));
        return;
      }

      let astrolabe;
      if (isLunar) {
        astrolabe = iztro.astro.byLunar(birthday, hourIndex, gender, isLeap, true, 'zh-CN');
      } else {
        astrolabe = iztro.astro.bySolar(birthday, hourIndex, gender, true, 'zh-CN');
      }

      const horoscope = astrolabe.horoscope(`${normalizedTargetYear}-01-01`);
      const decadalYearlyInfo = buildDecadalYearlyInfo(astrolabe, normalizedTargetYear, horoscope);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          astrolabe,
          horoscope,
          targetYear: normalizedTargetYear,
          decadalYearlyInfo,
        }),
      );
    } catch (error) {
      console.error('Ziwei API error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag/search') {
    try {
      const body = await parseRequestBody(req);
      const { query, topK = 3 } = body;

      if (!query) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing query parameter' }));
        return;
      }

      const results = await retrievalService.search(query, topK);
      const context = retrievalService.buildContext(results);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results, context }));
    } catch (error) {
      console.error('RAG search error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/rag/test') {
    try {
      const body = await parseRequestBody(req);
      const { query, topK = 3 } = body;

      if (!query) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing query parameter' }));
        return;
      }

      const results = await retrievalService.search(query, topK);
      const context = retrievalService.buildContext(results);
      const prompt = `你是一位专业的紫微斗数命理师，根据以下资料回答用户的问题：\n\n${context}\n\n用户问题：${query}\n\n请根据上述资料，提供详细、专业的回答。`;

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ results, context, prompt }));
    } catch (error) {
      console.error('RAG test error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/verify-code') {
    try {
      const body = await parseRequestBody(req);
      const { code } = body;

      if (!code) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '请输入邀请码' }));
        return;
      }

      if (code === process.env.AUTH_CODE) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, message: '验证成功' }));
      } else {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: '邀请码错误' }));
      }
    } catch (error) {
      console.error('Verify code error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  res.statusCode = 404;
  res.end();
});

server.listen(port, () => {
  console.log(`Ziwei server running at http://localhost:${port}`);
});
