export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatState {
  messages: Message[];
  needRefresh: boolean;
}

export interface ZiweiData {
  astrolabe: any;
  horoscope?: any;
  decadalYearlyInfo?: any;
  originalTime?: {
    hour: number;
    minute: number;
  };
  targetYear?: number;
}

export type PersonaType = 'companion' | 'mentor' | 'healer';

export interface PersonaConfig {
  id: PersonaType;
  name: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const PERSONA_CONFIGS: PersonaConfig[] = [
  {
    id: 'companion',
    name: '大白话解盘伴侣',
    title: 'The Plain-Language Companion',
    description: '直白、友好、接地气，把专业术语翻译为清晰建议。',
    icon: '💬',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'mentor',
    name: '硬核紫微导师',
    title: 'The Hardcore Ziwei Mentor',
    description: '结构化分析宫位、星曜、四化与运限联动。',
    icon: '📘',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'healer',
    name: '人生导航与疗愈师',
    title: 'The Life Navigator & Healer',
    description: '强调行动建议、心理支持与长期成长路径。',
    icon: '🌱',
    color: 'from-green-400 to-teal-500',
  },
];

export const PERSONA_PROMPTS: Record<PersonaType, string> = {
  companion: `你是“直白实用”的紫微解盘助手。先给结论，再给依据，避免玄学黑话。`,
  mentor: `你是“结构化严谨”的紫微分析助手。请结合宫位、星曜、四化和运限分层推断。`,
  healer: `你是“共情且可执行”的紫微助手。请在分析后给出具体可执行建议。`,
};

export const AI_MODELS = ['glm-4.7', 'qwen3.5-flash', 'kimi-k2.5'];

export function getDefaultSystemPrompt() {
  return `你是专业紫微斗数分析助手。当前未提供完整命盘，请提示用户先生成命盘后再提问。`;
}

const formatMutagen = (mutagen: string[] | undefined): string => {
  if (!Array.isArray(mutagen) || mutagen.length !== 4) return '无';
  return `${mutagen[0]}禄,${mutagen[1]}权,${mutagen[2]}科,${mutagen[3]}忌`;
};

function buildPalaceText(astrolabe: any, horoscope: any): string {
  const palaces = astrolabe?.palaces || [];
  const overlap =
    horoscope?.decadal?.earthlyBranch &&
    horoscope?.yearly?.earthlyBranch &&
    horoscope.decadal.earthlyBranch === horoscope.yearly.earthlyBranch
      ? '同宫'
      : '无';

  let result = '';
  for (const p of palaces) {
    const majorStr =
      (p?.majorStars || [])
        .map(
          (s: any) =>
            `${s?.name || ''}${s?.brightness ? `[${s.brightness}]` : ''}${s?.mutagen ? `[↑${s.mutagen}]` : ''}`,
        )
        .join('，') || '无';
    const minorStr =
      (p?.minorStars || [])
        .map((s: any) => `${s?.name || ''}${s?.brightness ? `[${s.brightness}]` : ''}`)
        .join('，') || '无';
    const adjectiveStr =
      (p?.adjectiveStars || [])
        .map((s: any) => `${s?.name || ''}${s?.brightness ? `[${s.brightness}]` : ''}`)
        .join('，') || '无';
    const stageRange = p?.decadal?.range || [0, 0];
    const minorAges = (p?.ages || []).slice(0, 5).join(',') || '无';

    result += `- ${p?.name || '未知'}宫[${p?.heavenlyStem || ''}${p?.earthlyBranch || ''}]
  ├主星 : ${majorStr}
  ├辅星 : ${minorStr}
  ├小星 : ${adjectiveStr}
  ├神煞
  │ ├岁前星 : ${p?.suiqian12 || '无'}
  │ ├将前星 : ${p?.jiangqian12 || '无'}
  │ ├十二长生 : ${p?.changsheng12 || '无'}
  │ └太岁煞禄 : ${p?.boshi12 || '无'}
  ├大限 : ${stageRange[0]} ~ ${stageRange[1]}虚岁
  ├小限 : ${minorAges}虚岁
  └限流叠宫 : ${overlap}

`;
  }
  return result;
}

function buildDecadalYearlyText(decadalYearlyInfo: any): string {
  if (!decadalYearlyInfo?.years?.length) {
    return '【大限流年信息】\n暂无逐年数据';
  }

  const first = decadalYearlyInfo.years[0];
  const last = decadalYearlyInfo.years[decadalYearlyInfo.years.length - 1];
  let result = `【大限流年信息】
├当前大限起止：${first.year}年(${decadalYearlyInfo.ageRange?.[0]}虚岁)~${last.year}年(${decadalYearlyInfo.ageRange?.[1]}虚岁)
├大限四化：${formatMutagen(first.decadalMutagen)}
├流年`;

  for (const item of decadalYearlyInfo.years) {
    result += `
│ ├${item.year}年[${item.yearGanzhi}](${item.nominalAge ?? '未知'}虚岁)
│ │ ├命宫干支:${item.lifePalaceGanzhi || '未知'}
│ │ ├流年四化:${formatMutagen(item.yearlyMutagen)}
│ │ └限流叠宫:${item.overlap || '无'}`;
  }

  return result;
}

export function parseZiweiToPrompt(fullData: ZiweiData): [string, string] {
  const pan = fullData.astrolabe;
  const yun = fullData.horoscope || {};
  const targetYear = fullData.targetYear || new Date().getFullYear();

  const originalHour = fullData.originalTime?.hour ?? 0;
  const originalMinute = fullData.originalTime?.minute ?? 0;
  const clockTime = `${pan?.solarDate || ''} ${String(originalHour).padStart(2, '0')}:${String(originalMinute).padStart(2, '0')}`;

  const baseInfo = [
    `性别：${pan?.gender || '未知'}`,
    `钟表时间：${clockTime}`,
    `农历时间：${pan?.lunarDate || '未知'} ${pan?.time || ''}`,
    `节气四柱：${pan?.chineseDate || '未知'}`,
    `五行局：${pan?.fiveElementsClass || '未知'}`,
    `身主：${pan?.body || '未知'}；命主：${pan?.soul || '未知'}；身宫：${pan?.earthlyBranchOfBodyPalace || '未知'}`,
    `当前流年：${targetYear}年`,
    `当前虚岁（iztro）：${yun?.age?.nominalAge ?? '未知'}`,
    `当前大限四化（iztro）：${formatMutagen(yun?.decadal?.mutagen)}`,
    `当前流年四化（iztro）：${formatMutagen(yun?.yearly?.mutagen)}`,
  ].join('\n');

  const palaceText = buildPalaceText(pan, yun);
  const decadalYearlyText = buildDecadalYearlyText(fullData.decadalYearlyInfo);

  const systemPrompt = `你是紫微斗数大师，请严格基于本次提供的 iztro 命盘与运限数据回答，不要使用模拟数据。`;
  const dataContext = `紫微斗数命盘
│
【基本信息】
${baseInfo}

【命盘十二宫】
${palaceText}
${decadalYearlyText}`;

  return [systemPrompt, dataContext];
}

export function generateMasterPrompt(
  userQuestion: string,
  fullData: ZiweiData,
  targetYear: number,
  persona: PersonaType = 'companion',
) {
  const pan = fullData.astrolabe;
  const yun = fullData.horoscope || {};
  const personaPrompt = PERSONA_PROMPTS[persona];

  const originalHour = fullData.originalTime?.hour ?? 0;
  const originalMinute = fullData.originalTime?.minute ?? 0;
  const clockTime = `${pan?.solarDate || ''} ${String(originalHour).padStart(2, '0')}:${String(originalMinute).padStart(2, '0')}`;
  const chineseHour = pan?.time || '';

  const [_, dataContext] = parseZiweiToPrompt(fullData);
  const compactOps = `当前流年：${targetYear}年；当前虚岁：${yun?.age?.nominalAge ?? '未知'}；当前流年四化：${formatMutagen(
    yun?.yearly?.mutagen,
  )}`;

  return `${personaPrompt}

# User Data
${dataContext}

【当前运限摘要】
${compactOps}

# Task
用户问题：${userQuestion}

# Response Guidelines
1. 先给结论，再给依据。
2. 明确区分本命结构与当前大限/流年引动。
3. 对四化必须引用本次数据中的实际字段（禄权科忌）。
4. 给出可执行建议，避免空泛结论。

# 重要提示
请只基于本次命盘数据。出生时间：${clockTime}；农历：${pan?.lunarDate || '未知'}${chineseHour}。`;
}

async function fetchRAGContext(query: string): Promise<string> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${API_BASE_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        topK: 3,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    return data.context || '';
  } catch (error) {
    console.error('RAG search error:', error);
    return '';
  }
}

export async function getLLMResponse(
  messages: Message[],
  model: string = 'qwen3.5-flash',
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array> | null> {
  const apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY;
  const baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is not set');
  }

  const enhancedMessages = messages;

  const requestBody: any = {
    model,
    messages: enhancedMessages,
    stream: true,
  };

  if (model === 'qwen3.5-flash') {
    requestBody.extra_body = { enable_thinking: true };
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  return response.body;
}

export { fetchRAGContext };
