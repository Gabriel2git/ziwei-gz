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
    <div className="w-full max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          选择你的 AI 命理师
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          不同的命理师有不同的解读风格，选择最适合你的方式
        </p>
      </div>

      {/* 三个卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PERSONA_CONFIGS.map((config) => {
          const isSelected = tempSelection === config.id;
          
          return (
            <div
              key={config.id}
              onClick={() => setTempSelection(config.id)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                hover:shadow-lg hover:scale-105 bg-white dark:bg-gray-800
                ${isSelected 
                  ? 'border-purple-500 shadow-xl scale-105 ring-1 ring-purple-500' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500'
                }
              `}
            >
              {/* 选中标记 */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* 图标 */}
              <div className="text-5xl mb-4">
                {config.icon}
              </div>

              {/* 标题 - 统一使用深色/浅色模式文字，仅加粗体现选中 */}
              <h3 className={`text-lg mb-1 text-gray-900 dark:text-gray-100 ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                {config.name}
              </h3>

              {/* 英文标题 - 统一灰色 */}
              <p className="text-xs mb-3 font-medium text-gray-500 dark:text-gray-400">
                {config.title}
              </p>

              {/* 描述 - 统一深灰色 */}
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {config.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 确认区域 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 text-center">
        <div className="mb-4">
          <span className="text-gray-600 dark:text-gray-400">已选择: </span>
          <span className="font-bold text-lg text-gray-900 dark:text-white">
            {selectedConfig?.icon} {selectedConfig?.name}
          </span>
        </div>
        
        <button
          onClick={handleConfirm}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 hover:shadow-xl transition-all duration-200"
        >
          确认选择并进入排盘
        </button>
      </div>
    </div>
  );
}
