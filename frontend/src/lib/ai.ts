﻿import type { DecadalBlock, Palace, SelectedContext, ZiweiData } from '@/types';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatState {
  messages: Message[];
  needRefresh: boolean;
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
    description: '直白、友好、接地气，把专业术语翻译成清晰建议。',
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
    description: '强调行动建议、情绪承接与长期成长路径。',
    icon: '🌱',
    color: 'from-green-400 to-teal-500',
  },
];

export const PERSONA_PROMPTS: Record<PersonaType, string> = {
  companion: '你是“直白实用”的紫微解盘助手。先给结论，再给依据，避免玄学黑话。',
  mentor: '你是“结构化严谨”的紫微分析助手。请结合宫位、星曜、四化和运限分层推断。',
  healer: '你是“共情且可执行”的紫微助手。请在分析后给出具体可执行建议。',
};

export const AI_MODELS = ['qwen3-max', 'glm-4.7', 'qwen3.5-flash', 'kimi-k2.5'];

const MUTAGEN_LABELS = ['禄', '权', '科', '忌'];

function formatMutagen(mutagen: string[] | undefined): string {
  if (!Array.isArray(mutagen) || mutagen.length === 0) return '无';
  return MUTAGEN_LABELS.map((label, index) => {
    const star = mutagen[index];
    return star ? `${star}${label}` : '';
  })
    .filter(Boolean)
    .join(',') || '无';
}

function formatStars(stars: any[] | undefined, withMutagen = false): string {
  if (!Array.isArray(stars) || stars.length === 0) return '无';
  return stars
    .map((star) => {
      const brightness = star?.brightness ? `[${star.brightness}]` : '';
      const mutagen = withMutagen && star?.mutagen ? `[${star.mutagen}]` : '';
      return `${star?.name || ''}${brightness}${mutagen}`;
    })
    .filter(Boolean)
    .join(',') || '无';
}

function formatCurrentYearField(palace: Palace, selectedContext: SelectedContext | undefined): string {
  if (!selectedContext?.yearly?.earthlyBranch) return '无';
  if (selectedContext.yearly.earthlyBranch !== palace.earthlyBranch) return '无';

  const age = selectedContext.nominalAge;
  const year = selectedContext.targetYear;
  if (typeof age === 'number') {
    return `${age}虚岁(${year}年)`;
  }
  return `${year}年`;
}

function buildPalaceText(astrolabe: any, selectedContext?: SelectedContext): string {
  const palaces: Palace[] = astrolabe?.palaces || [];

  return palaces
    .map((palace) => {
      const overlap =
        selectedContext?.decadal?.earthlyBranch &&
        selectedContext?.yearly?.earthlyBranch &&
        selectedContext.decadal.earthlyBranch === selectedContext.yearly.earthlyBranch
          ? '同宫'
          : '无';

      const start = palace?.decadal?.range?.[0] ?? '-';
      const end = palace?.decadal?.range?.[1] ?? '-';
      const minorAges = Array.isArray(palace?.ages) && palace.ages.length ? palace.ages.join(',') : '无';

      return `│ └${palace?.name || '未知宫'}[${palace?.heavenlyStem || ''}${palace?.earthlyBranch || ''}]
│   ├主星 : ${formatStars(palace?.majorStars, true)}
│   ├辅星 : ${formatStars(palace?.minorStars)}
│   ├小星 : ${formatStars(palace?.adjectiveStars)}
│   ├神煞
│   │ ├岁前星 : ${palace?.suiqian12 || '无'}
│   │ ├将前星 : ${palace?.jiangqian12 || '无'}
│   │ ├十二长生 : ${palace?.changsheng12 || '无'}
│   │ └太岁煞禄 : ${palace?.boshi12 || '无'}
│   ├大限 : ${start} ~ ${end}虚岁
│   ├小限 : ${minorAges}虚岁
│   ├流年 : ${formatCurrentYearField(palace, selectedContext)}
│   └限流叠宫 : ${overlap}`;
    })
    .join('\n\n');
}

function buildDecadalBlocksText(blocks: DecadalBlock[] | undefined): string {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return '├大限流年信息\n│ └无';
  }

  const sections = blocks.map((block) => {
    const startYear = block.yearRange?.[0] ?? '-';
    const endYear = block.yearRange?.[1] ?? '-';
    const startAge = block.decadalRange?.[0] ?? '-';
    const endAge = block.decadalRange?.[1] ?? '-';

    const yearlyText = (block.years || [])
      .map((item) => {
        return `│ │ │ ├${item.year}年[${item.yearGanzhi || '未知'}](${item.nominalAge ?? '未知'}虚岁)
│ │ │ │ ├命宫干支:${item.lifePalaceGanzhi || '未知'}
│ │ │ │ └流年四化:${formatMutagen(item.yearlyMutagen)}`;
      })
      .join('\n');

    return `│ ├第${block.index}大限[${block.decadalGanzhi || '未知'}]
│ │ ├起止年份:${startYear}年(${startAge}虚岁)~${endYear}年(${endAge}虚岁)
│ │ ├大限四化:${formatMutagen(block.decadalMutagen)}
│ │ ├流年
${yearlyText}`;
  });

  return `├大限流年信息\n│ │\n${sections.join('\n')}`;
}

function buildSelectedSummary(selectedContext: SelectedContext | undefined): string {
  if (!selectedContext) {
    return '当前选中大限/流年：无';
  }

  const decadalRange = Array.isArray(selectedContext.decadal?.range) && selectedContext.decadal.range.length === 2
    ? `${selectedContext.decadal.range[0]}-${selectedContext.decadal.range[1]}虚岁`
    : '未知';

  return [
    `当前选中流年：${selectedContext.targetYear}年（${selectedContext.nominalAge ?? '未知'}虚岁）`,
    `当前选中大限：${selectedContext.decadal?.heavenlyStem || ''}${selectedContext.decadal?.earthlyBranch || ''}（${decadalRange}）`,
    `当前大限四化：${formatMutagen(selectedContext.decadal?.mutagen)}`,
    `当前流年四化：${formatMutagen(selectedContext.yearly?.mutagen)}`,
  ].join('\n');
}

export function getDefaultSystemPrompt() {
  return '你是专业紫微斗数分析助手。当前未提供完整命盘，请提示用户先生成命盘后再提问。';
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
    '运限年份锚点：每年06-30（年中口径）',
    '系统基准年份：2026年',
    `当前推演年份：${targetYear}年`,
    `当前虚岁（iztro）：${yun?.age?.nominalAge ?? '未知'}`,
  ].join('\n');

  const palaceText = buildPalaceText(pan, fullData.selectedContext);
  const decadalBlocksText = buildDecadalBlocksText(fullData.promptDecadalBlocks);
  const selectedSummary = buildSelectedSummary(fullData.selectedContext);

  const systemPrompt = '你是紫微斗数大师，请严格基于本次提供的 iztro 命盘与运限实算数据回答，不要使用模拟数据。';
  const dataContext = `紫微斗数命盘
${baseInfo}

├命盘十二宫
${palaceText}

${decadalBlocksText}

├当前选择摘要
${selectedSummary}`;

  return [systemPrompt, dataContext];
}

export function generateMasterPrompt(
  userQuestion: string,
  fullData: ZiweiData,
  targetYear: number,
  persona: PersonaType = 'companion',
  selectionContext?: SelectedContext,
) {
  const personaPrompt = PERSONA_PROMPTS[persona];

  const mergedData: ZiweiData = {
    ...fullData,
    targetYear,
    selectedContext: selectionContext || fullData.selectedContext,
  };

  const [_, dataContext] = parseZiweiToPrompt(mergedData);

  return `${personaPrompt}

# User Data
${dataContext}

# Task
用户问题：${userQuestion}

# Response Guidelines
1. 先给结论，再给依据。
2. 明确区分本命结构与当前大限/流年引动。
3. 四化必须引用本次数据中的真实字段（禄权科忌）。
4. 给出可执行建议，避免空泛结论。`;
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

  const requestBody: any = {
    model,
    messages,
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
