import { AI_MODELS, Message } from './ai';

export interface LatencyResult {
  model: string;
  firstByteTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

/**
 * 测试单个模型的延迟
 */
async function testModelLatency(model: string): Promise<LatencyResult> {
  const apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY;
  const baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  if (!apiKey) {
    return {
      model,
      firstByteTime: 0,
      totalTime: 0,
      success: false,
      error: 'API Key 未设置',
    };
  }

  const testMessages: Message[] = [
    {
      role: 'system',
      content: '你是一个助手，请简短回复。',
    },
    {
      role: 'user',
      content: '你好，请回复"测试成功"四个字。',
    },
  ];

  const requestBody: any = {
    model,
    messages: testMessages,
    stream: true,
    max_tokens: 50,
  };

  if (model === 'qwen3.5-flash') {
    requestBody.extra_body = { enable_thinking: true };
  }

  const startTime = performance.now();
  let firstByteTime = 0;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        model,
        firstByteTime: 0,
        totalTime: 0,
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        model,
        firstByteTime: 0,
        totalTime: 0,
        success: false,
        error: '无法获取响应流',
      };
    }

    // 读取第一个数据块来计算首字节时间
    const { done } = await reader.read();
    firstByteTime = performance.now() - startTime;

    // 继续读取剩余数据
    while (!done) {
      const result = await reader.read();
      if (result.done) break;
    }

    reader.releaseLock();

    const totalTime = performance.now() - startTime;

    return {
      model,
      firstByteTime: Math.round(firstByteTime),
      totalTime: Math.round(totalTime),
      success: true,
    };
  } catch (error) {
    return {
      model,
      firstByteTime: 0,
      totalTime: 0,
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 测试所有模型的延迟
 */
export async function testAllModelsLatency(): Promise<LatencyResult[]> {
  console.log('🚀 开始测试模型延迟...\n');

  const results: LatencyResult[] = [];

  for (const model of AI_MODELS) {
    console.log(`⏳ 正在测试 ${model}...`);
    const result = await testModelLatency(model);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${model}: 首字节 ${result.firstByteTime}ms, 总耗时 ${result.totalTime}ms`);
    } else {
      console.log(`❌ ${model}: 失败 - ${result.error}`);
    }

    // 模型间添加短暂延迟，避免并发限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 测试结果汇总:');
  console.log('=' .repeat(60));
  console.log('模型名称          | 首字节时间 | 总响应时间 | 状态');
  console.log('-'.repeat(60));

  results.forEach(result => {
    const modelPadded = result.model.padEnd(17);
    if (result.success) {
      const firstBytePadded = `${result.firstByteTime}ms`.padEnd(10);
      const totalPadded = `${result.totalTime}ms`.padEnd(10);
      console.log(`${modelPadded}| ${firstBytePadded}| ${totalPadded}| ✅ 正常`);
    } else {
      console.log(`${modelPadded}| ${'-'.padEnd(10)}| ${'-'.padEnd(10)}| ❌ ${result.error}`);
    }
  });

  console.log('='.repeat(60));

  // 按首字节时间排序
  const sortedResults = [...results].sort((a, b) => {
    if (!a.success) return 1;
    if (!b.success) return -1;
    return a.firstByteTime - b.firstByteTime;
  });

  console.log('\n🏆 延迟排名（按首字节时间）:');
  sortedResults.forEach((result, index) => {
    if (result.success) {
      console.log(`  ${index + 1}. ${result.model}: ${result.firstByteTime}ms`);
    }
  });

  return results;
}

/**
 * 运行多次测试获取平均值
 */
export async function runLatencyBenchmark(iterations: number = 3): Promise<void> {
  console.log(`\n🔬 运行基准测试: ${iterations} 次迭代\n`);

  const allResults: LatencyResult[][] = [];

  for (let i = 0; i < iterations; i++) {
    console.log(`\n📌 第 ${i + 1}/${iterations} 轮测试`);
    const results = await testAllModelsLatency();
    allResults.push(results);

    if (i < iterations - 1) {
      console.log('\n⏸️ 等待 2 秒后进行下一轮...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 计算平均值
  console.log('\n\n📈 平均延迟统计:');
  console.log('='.repeat(70));
  console.log('模型名称          | 平均首字节 | 平均总时间 | 成功率');
  console.log('-'.repeat(70));

  const modelStats: Record<string, { firstByteTimes: number[]; totalTimes: number[]; successCount: number }> = {};

  AI_MODELS.forEach(model => {
    modelStats[model] = { firstByteTimes: [], totalTimes: [], successCount: 0 };
  });

  allResults.forEach(round => {
    round.forEach(result => {
      if (result.success) {
        modelStats[result.model].firstByteTimes.push(result.firstByteTime);
        modelStats[result.model].totalTimes.push(result.totalTime);
        modelStats[result.model].successCount++;
      }
    });
  });

  AI_MODELS.forEach(model => {
    const stats = modelStats[model];
    const avgFirstByte = stats.firstByteTimes.length > 0
      ? Math.round(stats.firstByteTimes.reduce((a, b) => a + b, 0) / stats.firstByteTimes.length)
      : 0;
    const avgTotal = stats.totalTimes.length > 0
      ? Math.round(stats.totalTimes.reduce((a, b) => a + b, 0) / stats.totalTimes.length)
      : 0;
    const successRate = Math.round((stats.successCount / iterations) * 100);

    const modelPadded = model.padEnd(17);
    const firstBytePadded = stats.firstByteTimes.length > 0 ? `${avgFirstByte}ms`.padEnd(10) : 'N/A'.padEnd(10);
    const totalPadded = stats.totalTimes.length > 0 ? `${avgTotal}ms`.padEnd(10) : 'N/A'.padEnd(10);
    const ratePadded = `${successRate}%`.padEnd(7);

    console.log(`${modelPadded}| ${firstBytePadded}| ${totalPadded}| ${ratePadded}`);
  });

  console.log('='.repeat(70));
}
