'use client';

import React, { useState } from 'react';
import { PersonaType, PERSONA_CONFIGS } from '@/lib/ai';

interface PersonaSelectorProps {
  selectedPersona: PersonaType;
  onPersonaChange: (persona: PersonaType) => void;
}

export default function PersonaSelector({ selectedPersona, onPersonaChange }: PersonaSelectorProps) {
  const [tempSelection, setTempSelection] = useState<PersonaType>(selectedPersona);

  const handleConfirm = () => {
    onPersonaChange(tempSelection);
  };

  const selectedConfig = PERSONA_CONFIGS.find(p => p.id === tempSelection);

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          选择你的 AI 命理师
        </h2>
        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
          不同的命理师有不同的解读风格，选择最适合你的方式
        </p>
      </div>

      {/* 三个卡片 - 竖向排列，宽度一致 */}
      <div className="flex flex-col items-center gap-2 sm:gap-6 mb-4 w-full max-w-[180px] mx-auto">
        {PERSONA_CONFIGS.map((config) => {
          const isSelected = tempSelection === config.id;
          
          return (
            <div
              key={config.id}
              onClick={() => setTempSelection(config.id)}
              className={`
                relative w-full p-2 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer
                hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800
                ${isSelected 
                  ? 'border-purple-500 shadow-xl scale-105 ring-1 ring-purple-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500'
                }
              `}
            >
              {/* 选中标记 */}
              {isSelected && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* 图标 */}
              <div className="text-2xl sm:text-5xl mb-1 sm:mb-4">
                {config.icon}
              </div>

              {/* 标题 - 统一使用深色/浅色模式文字，仅加粗体现选中 */}
              <h3 className={`text-sm sm:text-lg mb-0.5 text-gray-900 dark:text-gray-100 ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                {config.name}
              </h3>

              {/* 英文标题 - 统一灰色 */}
              <p className="text-[10px] mb-1 sm:mb-3 font-medium text-gray-500 dark:text-gray-400">
                {config.title}
              </p>

              {/* 描述 - 手机端隐藏，桌面端显示 */}
              <p className="hidden sm:block text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {config.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 确认区域 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
        <div className="mb-2 sm:mb-4">
          <span className="text-gray-600 dark:text-gray-400">已选择: </span>
          <span className="font-bold text-sm sm:text-lg text-gray-900 dark:text-white">
            {selectedConfig?.icon} {selectedConfig?.name}
          </span>
        </div>
        
        <button
          onClick={handleConfirm}
          className="w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 hover:shadow-xl transition-all duration-200"
        >
          确认选择并进入
        </button>
      </div>
    </div>
  );
}
