'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AI_MODELS, Message } from '@/lib/ai';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface TestResult {
  model: string;
  firstByteTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

export default function ModelLatencyTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动日志到底部
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 添加日志
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(prev => [...prev, { time, message, type }]);
  }, []);

  // 清空日志
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 测试单个模型延迟
  const testModelLatency = async (model: string): Promise<TestResult> => {
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
      { role: 'system', content: '你是一个助手，请简短回复。' },
      { role: 'user', content: '你好，请回复"测试成功"四个字。' },
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
      await reader.read();
      const firstByteTime = Math.round(performance.now() - startTime);

      // 继续读取剩余数据
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }

      reader.releaseLock();

      const totalTime = Math.round(performance.now() - startTime);

      return {
        model,
        firstByteTime,
        totalTime,
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
  };

  // 运行单次测试
  const runSingleTest = useCallback(async () => {
    setIsTesting(true);
    setResults([]);
    clearLogs();
    
    addLog('🚀 开始单次延迟测试...', 'info');
    addLog(`📋 测试模型: ${AI_MODELS.join(', ')}`, 'info');
    addLog('', 'info');

    const testResults: TestResult[] = [];

    for (const model of AI_MODELS) {
      addLog(`⏳ 正在测试 ${model}...`, 'info');
      
      const result = await testModelLatency(model);
      testResults.push(result);

      if (result.success) {
        addLog(
          `✅ ${model}: 首字节 ${result.firstByteTime}ms, 总耗时 ${result.totalTime}ms`,
          'success'
        );
      } else {
        addLog(`❌ ${model}: 失败 - ${result.error}`, 'error');
      }

      // 模型间添加短暂延迟
      if (model !== AI_MODELS[AI_MODELS.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    addLog('', 'info');
    addLog('📊 单次测试完成！', 'success');
    
    // 显示排名
    const successful = testResults.filter(r => r.success);
    if (successful.length > 0) {
      addLog('', 'info');
      addLog('🏆 延迟排名:', 'info');
      [...successful]
        .sort((a, b) => a.firstByteTime - b.firstByteTime)
        .forEach((result, index) => {
          addLog(`  ${index + 1}. ${result.model}: ${result.firstByteTime}ms`, 'info');
        });
    }

    setResults(testResults);
    setIsTesting(false);
  }, [addLog, clearLogs]);

  // 运行基准测试
  const runBenchmark = useCallback(async () => {
    setIsBenchmarking(true);
    setResults([]);
    clearLogs();
    
    const iterations = 3;
    addLog(`🔬 开始基准测试: ${iterations} 轮迭代`, 'info');
    addLog(`📋 测试模型: ${AI_MODELS.join(', ')}`, 'info');
    addLog('', 'info');

    const allResults: TestResult[][] = [];

    for (let i = 0; i < iterations; i++) {
      addLog(`📌 第 ${i + 1}/${iterations} 轮测试开始`, 'warning');
      
      const roundResults: TestResult[] = [];
      
      for (const model of AI_MODELS) {
        addLog(`  ⏳ 测试 ${model}...`, 'info');
        
        const result = await testModelLatency(model);
        roundResults.push(result);

        if (result.success) {
          addLog(
            `  ✅ ${model}: ${result.firstByteTime}ms`,
            'success'
          );
        } else {
          addLog(`  ❌ ${model}: ${result.error}`, 'error');
        }

        if (model !== AI_MODELS[AI_MODELS.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      allResults.push(roundResults);
      addLog(`  ✓ 第 ${i + 1} 轮完成`, 'success');
      addLog('', 'info');

      if (i < iterations - 1) {
        addLog('⏸️ 等待 2 秒后进行下一轮...', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        addLog('', 'info');
      }
    }

    // 计算平均值
    addLog('📈 计算统计数据...', 'info');
    addLog('', 'info');

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

    addLog('📊 平均延迟统计:', 'info');
    
    const finalResults: TestResult[] = [];
    AI_MODELS.forEach(model => {
      const stats = modelStats[model];
      const avgFirstByte = stats.firstByteTimes.length > 0
        ? Math.round(stats.firstByteTimes.reduce((a, b) => a + b, 0) / stats.firstByteTimes.length)
        : 0;
      const avgTotal = stats.totalTimes.length > 0
        ? Math.round(stats.totalTimes.reduce((a, b) => a + b, 0) / stats.totalTimes.length)
        : 0;
      const successRate = Math.round((stats.successCount / iterations) * 100);

      finalResults.push({
        model,
        firstByteTime: avgFirstByte,
        totalTime: avgTotal,
        success: stats.successCount > 0,
      });

      if (stats.firstByteTimes.length > 0) {
        addLog(
          `  ${model}: 平均首字节 ${avgFirstByte}ms, 平均总时间 ${avgTotal}ms, 成功率 ${successRate}%`,
          'info'
        );
      } else {
        addLog(`  ${model}: 测试失败`, 'error');
      }
    });

    // 显示排名
    const successful = finalResults.filter(r => r.success);
    if (successful.length > 0) {
      addLog('', 'info');
      addLog('🏆 平均延迟排名:', 'info');
      [...successful]
        .sort((a, b) => a.firstByteTime - b.firstByteTime)
        .forEach((result, index) => {
          addLog(`  ${index + 1}. ${result.model}: ${result.firstByteTime}ms`, 'info');
        });
    }

    addLog('', 'info');
    addLog('✅ 基准测试全部完成！', 'success');

    setResults(finalResults);
    setIsBenchmarking(false);
  }, [addLog, clearLogs]);

  // 获取日志颜色
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  // 计算统计数据
  const getStats = () => {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return null;

    const avgFirstByte = Math.round(
      successful.reduce((sum, r) => sum + r.firstByteTime, 0) / successful.length
    );
    const avgTotal = Math.round(
      successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length
    );
    const fastest = successful.reduce((min, r) =>
      r.firstByteTime < min.firstByteTime ? r : min
    );

    return { avgFirstByte, avgTotal, fastest };
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        🤖 AI 模型延迟测试
      </h1>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">测试说明</h2>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>• 测试指标：首字节时间 (TTFB) 和总响应时间</li>
          <li>• 测试模型：{AI_MODELS.join('、')}</li>
          <li>• 每个模型发送相同的简短测试请求</li>
          <li>• 基准测试会运行 3 轮并计算平均值</li>
        </ul>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runSingleTest}
          disabled={isTesting || isBenchmarking}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? '⏳ 测试中...' : '▶️ 单次测试'}
        </button>

        <button
          onClick={runBenchmark}
          disabled={isTesting || isBenchmarking}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isBenchmarking ? '⏳ 基准测试中...' : '📊 运行基准测试 (3轮)'}
        </button>

        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            disabled={isTesting || isBenchmarking}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ 清空日志
          </button>
        )}
      </div>

      {/* 终端式日志显示 */}
      {logs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">测试日志</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {logs.length} 条记录
            </span>
          </div>
          <div
            ref={logsContainerRef}
            className="bg-gray-900 dark:bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-700"
          >
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.time}]</span>{' '}
                <span className={getLogColor(log.type)}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">平均首字节时间</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.avgFirstByte}ms
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">平均总响应时间</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.avgTotal}ms
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-sm text-gray-500 dark:text-gray-400">最快模型</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {stats.fastest.model}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stats.fastest.firstByteTime}ms
            </div>
          </div>
        </div>
      )}

      {/* 测试结果表格 */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  模型名称
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  首字节时间
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  总响应时间
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {results.map((result, index) => (
                <tr
                  key={result.model}
                  className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {result.model}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {result.success ? `${result.firstByteTime} ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                    {result.success ? `${result.totalTime} ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {result.success ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 rounded-full">
                        ✅ 正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 rounded-full">
                        ❌ 失败
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 排名 */}
      {results.filter(r => r.success).length > 1 && (
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-300">
            🏆 延迟排名（按首字节时间）
          </h3>
          <ol className="space-y-2">
            {[...results]
              .filter(r => r.success)
              .sort((a, b) => a.firstByteTime - b.firstByteTime)
              .map((result, index) => (
                <li
                  key={result.model}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    <span className="inline-block w-6 font-bold text-purple-600 dark:text-purple-400">
                      {index + 1}.
                    </span>
                    {result.model}
                  </span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">
                    {result.firstByteTime}ms
                  </span>
                </li>
              ))}
          </ol>
        </div>
      )}
    </div>
  );
}
