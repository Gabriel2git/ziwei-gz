import { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/ai';

interface BirthData {
  birthday: string;
  birthTime: number;
  birthMinute: number;
  birthdayType: 'solar' | 'lunar';
  gender: 'male' | 'female';
  longitude: number;
}

interface AIChatProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isLoading: boolean;
  debugPrompt: string;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  selectedModel: string;
  hasBirthData: boolean;
  birthData: BirthData | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSaveHistory: () => void;
  onLoadHistory: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// 打字机效果 Hook
function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isComplete };
}

// 格式化消息内容 - 高亮命盘数据
function formatMessageContent(content: string) {
  // 高亮代码块
  let formatted = content.replace(
    /```([\s\S]*?)```/g,
    '<pre class="terminal my-2"><code>$1</code></pre>'
  );
  
  // 高亮行内代码
  formatted = formatted.replace(
    /`([^`]+)`/g,
    '<code class="px-1 py-0.5 rounded" style="background: rgba(0, 243, 255, 0.15); color: var(--neon-cyan); font-family: monospace;">$1</code>'
  );
  
  // 高亮星曜名称 (如: 紫微、天府等)
  const starNames = ['紫微', '天府', '天相', '武曲', '贪狼', '巨门', '天机', '太阳', '太阴', '天梁', '七杀', '破军', '廉贞', '天同', '文昌', '文曲', '左辅', '右弼', '天魁', '天钺', '禄存', '天马', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  starNames.forEach(star => {
    formatted = formatted.replace(
      new RegExp(star, 'g'),
      `<span class="star-purple">${star}</span>`
    );
  });
  
  // 高亮宫位名称
  const palaceNames = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
  palaceNames.forEach(palace => {
    formatted = formatted.replace(
      new RegExp(palace, 'g'),
      `<span class="star-cyan">${palace}</span>`
    );
  });
  
  return formatted;
}

// 打字机消息组件
function TypewriterMessage({ content, isNew }: { content: string; isNew: boolean }) {
  const { displayedText, isComplete } = useTypewriter(isNew ? content : '', 20);
  const displayContent = isNew ? (isComplete ? content : displayedText) : content;
  
  return (
    <div 
      className="whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ 
        __html: formatMessageContent(displayContent) 
      }}
    />
  );
}

export default function AIChat({
  messages,
  inputMessage,
  setInputMessage,
  isLoading,
  debugPrompt,
  showDebug,
  setShowDebug,
  selectedModel,
  hasBirthData,
  birthData,
  messagesEndRef,
  messagesContainerRef,
  onSendMessage,
  onKeyPress,
  onSaveHistory,
  onLoadHistory
}: AIChatProps) {
  // 记录最后一条消息的索引，用于触发打字机效果
  const lastMessageIndex = messages.length - 1;

  return (
    <div className="h-full flex flex-col relative">
      {/* 头部 - 赛博风格 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[var(--neon-cyan)] pulse-glow"></div>
          <h2 className="text-xl font-bold neon-text" style={{ color: 'var(--neon-cyan)' }}>
            AI 命理师
          </h2>
          <span className="text-xs px-2 py-0.5 rounded border border-[var(--neon-cyan)] text-[var(--neon-cyan)] opacity-70">
            ONLINE
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSaveHistory}
            className="cyber-button text-sm px-4 py-2"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 243, 255, 0.2))',
              borderColor: 'var(--success)'
            }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              导出
            </span>
          </button>
          <label 
            className="cyber-button text-sm px-4 py-2 cursor-pointer"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.2), rgba(179, 0, 255, 0.2))'
            }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导入
            </span>
            <input
              type="file"
              accept=".json"
              onChange={onLoadHistory}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="cyber-button text-sm px-4 py-2"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 0, 255, 0.2))',
              borderColor: 'var(--warning)'
            }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              调试
            </span>
          </button>
        </div>
      </div>

      {/* 聊天区 - 终端风格 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar terminal mb-4"
        style={{ 
          background: 'rgba(5, 5, 8, 0.95)',
          border: '1px solid rgba(0, 243, 255, 0.3)',
          borderRadius: '8px',
          minHeight: '300px'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--neon-cyan)', opacity: 0.6 }}>
            <div className="text-center">
              <div className="text-4xl mb-4 opacity-50">◈</div>
              <p className="font-mono">请先在左侧输入出生信息，然后开始对话</p>
              <p className="text-xs mt-2 opacity-50">SYSTEM READY...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg glass relative ${
                    message.role === 'user'
                      ? ''
                      : ''
                  }`}
                  style={{
                    background: message.role === 'user' 
                      ? 'rgba(0, 243, 255, 0.1)'
                      : message.role === 'system'
                        ? 'rgba(255, 215, 0, 0.1)'
                        : 'rgba(179, 0, 255, 0.1)',
                    border: message.role === 'user'
                      ? '1px solid rgba(0, 243, 255, 0.4)'
                      : message.role === 'system'
                        ? '1px solid rgba(255, 215, 0, 0.4)'
                        : '1px solid rgba(179, 0, 255, 0.4)',
                    boxShadow: message.role === 'user'
                      ? '0 0 15px rgba(0, 243, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                      : message.role === 'system'
                        ? '0 0 15px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                        : '0 0 15px rgba(179, 0, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}
                >
                  {/* 消息角色标签 */}
                  <div 
                    className="text-xs font-mono mb-2 uppercase tracking-wider"
                    style={{ 
                      color: message.role === 'user' 
                        ? 'var(--neon-cyan)'
                        : message.role === 'system'
                          ? 'var(--neon-gold)'
                          : 'var(--neon-purple)'
                    }}
                  >
                    {message.role === 'user' ? '> USER' : message.role === 'system' ? '> SYSTEM' : '> AI_MASTER'}
                  </div>
                  
                  {/* 消息内容 */}
                  <div 
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <TypewriterMessage 
                      content={message.content} 
                      isNew={index === lastMessageIndex && message.role === 'assistant'} 
                    />
                  </div>
                  
                  {/* 装饰角标 */}
                  <div 
                    className="absolute top-0 right-0 w-2 h-2"
                    style={{
                      borderTop: `2px solid ${message.role === 'user' ? 'var(--neon-cyan)' : message.role === 'system' ? 'var(--neon-gold)' : 'var(--neon-purple)'}`,
                      borderRight: `2px solid ${message.role === 'user' ? 'var(--neon-cyan)' : message.role === 'system' ? 'var(--neon-gold)' : 'var(--neon-purple)'}`,
                      opacity: 0.6
                    }}
                  />
                  <div 
                    className="absolute bottom-0 left-0 w-2 h-2"
                    style={{
                      borderBottom: `2px solid ${message.role === 'user' ? 'var(--neon-cyan)' : message.role === 'system' ? 'var(--neon-gold)' : 'var(--neon-purple)'}`,
                      borderLeft: `2px solid ${message.role === 'user' ? 'var(--neon-cyan)' : message.role === 'system' ? 'var(--neon-gold)' : 'var(--neon-purple)'}`,
                      opacity: 0.6
                    }}
                  />
                </div>
              </div>
            ))}
            
            {/* 加载动画 - 赛博风格 */}
            {isLoading && (
              <div className="flex justify-start">
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    background: 'rgba(179, 0, 255, 0.1)',
                    border: '1px solid rgba(179, 0, 255, 0.3)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--neon-purple)' }}>
                      AI计算中
                    </span>
                    <div className="flex space-x-1">
                      <div 
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: 'var(--neon-cyan)', animationDelay: '0s' }}
                      />
                      <div 
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: 'var(--neon-purple)', animationDelay: '0.2s' }}
                      />
                      <div 
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: 'var(--neon-pink)', animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区 - 赛博朋克风格 */}
      <div 
        className="p-4 rounded-lg"
        style={{ 
          background: 'rgba(45, 27, 78, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={hasBirthData ? "请输入您的问题..." : "请先完成命盘排布"}
              disabled={isLoading || !hasBirthData}
              className="cyber-input resize-none"
              style={{
                minHeight: '80px',
                background: 'rgba(5, 5, 8, 0.6)',
                opacity: isLoading || !hasBirthData ? 0.5 : 1
              }}
              rows={3}
            />
            {/* 输入框装饰线 */}
            <div 
              className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
              style={{ 
                width: inputMessage ? '100%' : '0%',
                background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))'
              }}
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim() || !hasBirthData}
            className="cyber-button px-6 py-3 self-end"
            style={{
              opacity: isLoading || !inputMessage.trim() || !hasBirthData ? 0.5 : 1,
              cursor: isLoading || !inputMessage.trim() || !hasBirthData ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  计算中
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  发送
                </>
              )}
            </span>
          </button>
        </div>
        
        {/* 状态提示 */}
        <div className="flex justify-between items-center mt-3">
          {!hasBirthData ? (
            <p className="text-xs font-mono" style={{ color: 'var(--warning)' }}>
              ⚠ 请先在左侧输入出生信息并排盘
            </p>
          ) : (
            <p className="text-xs font-mono" style={{ color: 'var(--neon-cyan)', opacity: 0.6 }}>
              {selectedModel ? `MODEL: ${selectedModel}` : 'SYSTEM READY'}
            </p>
          )}
          <p className="text-xs font-mono" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            Press Enter to send
          </p>
        </div>
      </div>

      {/* 调试窗口 - 终端风格 */}
      {showDebug && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(5, 5, 8, 0.9)', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="rounded-lg text-xs font-mono max-w-4xl w-full max-h-[80vh] flex flex-col"
            style={{ 
              background: 'rgba(5, 5, 8, 0.98)',
              border: '1px solid rgba(0, 243, 255, 0.4)',
              boxShadow: '0 0 30px rgba(0, 243, 255, 0.2)'
            }}
          >
            <div 
              className="flex justify-between items-center p-4 border-b"
              style={{ borderColor: 'rgba(0, 243, 255, 0.2)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--neon-cyan)' }} />
                <h3 className="font-bold" style={{ color: 'var(--neon-cyan)' }}>
                  SYSTEM_PROMPT_DEBUG
                </h3>
              </div>
              <button
                onClick={() => setShowDebug(false)}
                className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                style={{ color: 'var(--foreground)' }}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <pre 
                className="whitespace-pre-wrap"
                style={{ color: 'var(--success)', lineHeight: '1.6' }}
              >
                {debugPrompt}
              </pre>
            </div>
            <div 
              className="p-4 border-t flex justify-end"
              style={{ borderColor: 'rgba(0, 243, 255, 0.2)' }}
            >
              <button
                onClick={() => setShowDebug(false)}
                className="cyber-button px-4 py-2 text-sm"
              >
                关闭 [ESC]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
