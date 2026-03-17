import { useState } from 'react';
import BirthForm from '@/components/BirthForm';
import { AI_MODELS } from '@/lib/ai';

export type PageType = 'chart' | 'ai' | 'rag';

interface SidebarProps {
  currentPage: PageType | 'model-test';
  setCurrentPage: (page: PageType | 'model-test') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onDataLoaded: (data: any) => void;
}

export default function Sidebar({
  currentPage,
  setCurrentPage,
  selectedModel,
  setSelectedModel,
  darkMode,
  toggleDarkMode,
  onDataLoaded,
}: SidebarProps) {
  const [showQuickStart, setShowQuickStart] = useState(false);

  return (
    <aside className="w-full bg-white dark:bg-[#1a2a2a] shadow-xl p-4 lg:p-5 flex flex-col h-full overflow-y-auto">
      <div className="hidden md:flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-400">FatePilot</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickStart((prev) => !prev)}
            className="px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
          >
            快速上手
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            aria-label={darkMode ? '切换到浅色模式' : '切换到深色模式'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className="mb-4 md:mb-5">
        <div className="flex items-center justify-between md:block">
          <button
            onClick={() => setShowQuickStart((prev) => !prev)}
            className="md:hidden px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
          >
            快速上手
          </button>
        </div>
      </div>

      <div className="hidden md:block mb-4 space-y-2">
        <button
          onClick={() => setCurrentPage('chart')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            currentPage === 'chart'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          命盘显示
        </button>
        <button
          onClick={() => setCurrentPage('ai')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            currentPage === 'ai'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          AI 命理师
        </button>
        <button
          onClick={() => setCurrentPage('rag')}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            currentPage === 'rag'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 font-semibold'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          RAG 测试
        </button>
      </div>

      {showQuickStart && (
        <div className="mb-5 rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-[#1a2a2a] p-4 text-sm text-gray-700 dark:text-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-purple-800 dark:text-purple-300">快速上手</p>
            <button
              onClick={() => setShowQuickStart(false)}
              className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              收起
            </button>
          </div>
          <p>1. 先在下方输入出生日期和时辰。</p>
          <p>2. 点击“开始排盘”后查看命盘。</p>
          <p>3. 点击大限和流年按钮观察命盘边框反馈。</p>
          <p>4. 切到 AI 命理师页面继续提问。</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">出生信息</h3>
            <span className="text-[11px] uppercase tracking-[0.18em] text-purple-500 dark:text-purple-300">core input</span>
          </div>
          <BirthForm
            onDataLoaded={(data) => {
              onDataLoaded(data);
              setCurrentPage('chart');
            }}
          />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/30">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">AI 模型</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 mb-2"
          >
            {AI_MODELS.map((model) => (
              <option key={model} value={model} className="text-gray-900 dark:text-gray-100">
                {model}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCurrentPage('model-test')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === 'model-test'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            ⚡ 模型延迟测试
          </button>
        </div>
      </div>
    </aside>
  );
}
