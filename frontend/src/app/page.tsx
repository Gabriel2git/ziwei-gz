'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getLunarBaseYear } from '@/lib/shichen';
import { AI_MODELS } from '@/lib/ai';
import { useZiweiData } from '@/hooks/useZiweiData';
import { useAIChat } from '@/hooks/useAIChat';
import { useSavedCases } from '@/hooks/useSavedCases';
import Sidebar from '@/components/Sidebar';
import ChartView from '@/components/ChartView';
import RagTest from '@/components/RagTest';
import AIFortuneTeller from '@/components/AIFortuneTeller';

// 扩展页面类型
type PageType = '命盘显示' | 'AI 命理师' | 'RAG 测试';

interface BirthData {
  birthday: string;
  birthTime: number;
  birthMinute: number;
  birthdayType: 'solar' | 'lunar';
  gender: 'male' | 'female';
  longitude: number;
  isLeap: boolean;
}

interface DecadalInfo {
  start: number;
  end: number;
  stem: string;
  branch: string;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('命盘显示');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [darkMode, setDarkMode] = useState(false);
  
  // 侧边栏宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // 移动端侧边栏状态
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理拖动开始
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    e.preventDefault();
  }, [sidebarWidth]);

  // 处理拖动中
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    const newWidth = Math.max(200, Math.min(400, dragStartWidth.current + delta));
    setSidebarWidth(newWidth);
  }, [isDragging]);

  // 处理拖动结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加/移除全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const [hasBirthData, setHasBirthData] = useState(false);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [selectedDecadal, setSelectedDecadal] = useState<DecadalInfo | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { ziweiData, isRefreshingData, horoscopeYear, error, loadZiweiData, updateHoroscopeYear, setError } = useZiweiData();
  const {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    debugPrompt,
    setDebugPrompt,
    selectedPersona,
    setSelectedPersona,
    messagesEndRef,
    messagesContainerRef,
    initializeChat,
    updateChatForHoroscope,
    sendMessage,
    saveChatHistory,
    loadChatHistory,
    stopGeneration
  } = useAIChat(ziweiData, horoscopeYear);
  const { savedCases, saveCase, deleteCase } = useSavedCases();

  const toggleDarkMode = () => {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.toggle('dark');
    setDarkMode(isDark);
  };

  const handleDataLoaded = async (data: BirthData) => {
    setBirthData(data);
    setHasBirthData(true);
    setError(null); // 清除之前的错误
    
    try {
      const realZiweiData = await loadZiweiData(data);
      initializeChat(realZiweiData);
    } catch (error) {
      console.error('获取后端数据失败:', error);
      // 错误已经在 useZiweiData 中设置
    }
  };

  const handleHoroscopeDateChange = async (date: Date) => {
    if (!birthData || isRefreshingData) return;
    
    const newYear = date.getFullYear();
    if (newYear === horoscopeYear) return;
    
    setError(null); // 清除之前的错误
    try {
      const realZiweiData = await updateHoroscopeYear(birthData, newYear);
      updateChatForHoroscope(realZiweiData);
    } catch (error) {
      console.error('更新命盘数据失败:', error);
      // 错误已经在 useZiweiData 中设置
    }
  };

  const handleSaveCurrentCase = () => {
    if (!birthData || !ziweiData) {
      alert('请先排盘后再保存命例');
      return;
    }
    const caseName = prompt('请输入命例名称:');
    if (!caseName) return;

    saveCase({
      id: Date.now().toString(),
      name: caseName,
      birthData,
      ziweiData,
      savedAt: new Date().toISOString()
    });
    alert('命例保存成功！');
  };

  const handleLoadSavedCase = async (caseData: any) => {
    setBirthData(caseData.birthData);
    setShowSavedCases(false);
    
    try {
      const realZiweiData = await loadZiweiData(caseData.birthData);
      initializeChat(realZiweiData);
      setHasBirthData(true);
      alert('命例加载成功！');
    } catch (error) {
      console.error('加载命例失败:', error);
      alert('加载命例失败，请重试');
    }
  };

  const handleDeleteSavedCase = (caseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('确定要删除这个命例吗？')) {
      deleteCase(caseId);
      alert('命例删除成功！');
    }
  };

  const handleTestAIPrompt = (savedCase: any) => {
    // 将当前页面切换到AI命理师页面
    setCurrentPage('AI 命理师');
    
    // 使用保存的命例数据初始化聊天
    initializeChat(savedCase.ziweiData);
    
    // 可以在这里生成一个基于命例的测试prompt
    const testPrompt = `请分析以下命盘：\n姓名信息：${savedCase.name}\n出生日期：${savedCase.birthData.birthday}\n性别：${savedCase.birthData.gender}\n命盘数据：${JSON.stringify(savedCase.ziweiData, null, 2)}`;
    
    // 将测试prompt设置为调试信息
    setDebugPrompt(testPrompt);
    
    // 可以自动发送这个prompt到AI
    setInputMessage(testPrompt);
    setTimeout(() => {
      sendMessage(selectedModel);
    }, 500); // 延迟发送，确保页面已切换
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(selectedModel);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50 dark:from-[#0f1a1a] dark:to-[#0a1414]">
      <div className="flex h-full">
        {/* 桌面端侧边栏容器 */}
        <div 
          ref={sidebarRef}
          className="hidden md:block relative flex-shrink-0"
          style={{ width: sidebarWidth }}
        >
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onDataLoaded={handleDataLoaded}
          />
          
          {/* 拖动条 */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-purple-500/30 transition-colors z-50"
            onMouseDown={handleDragStart}
            style={{ cursor: isDragging ? 'col-resize' : 'ew-resize' }}
          >
            {/* 拖动指示器 */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-gray-400 dark:bg-gray-600 rounded-full opacity-50 hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 移动端侧边栏遮罩 */}
        {mobileSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 z-50 bg-white dark:bg-[#1a2a2a] shadow-2xl md:hidden overflow-y-auto">
              <div className="p-4">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center gap-2"
                >
                  <span>✕</span>
                  <span>关闭</span>
                </button>
                <Sidebar
                  currentPage={currentPage}
                  setCurrentPage={(page) => {
                    setCurrentPage(page);
                    setMobileSidebarOpen(false);
                  }}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                  onDataLoaded={handleDataLoaded}
                />
              </div>
            </div>
          </>
        )}

        <main className="flex-1 p-1 md:p-6 overflow-hidden pb-16 md:pb-6">
          {/* 错误信息显示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
              <div className="flex items-center">
                <div className="mr-2 text-red-500">⚠️</div>
                <div>{error}</div>
              </div>
            </div>
          )}
          
          {/* 移动端顶部导航栏 */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow flex items-center gap-2"
            >
              <span>☰</span>
              <span className="text-sm">菜单</span>
            </button>
            <h1 className="text-lg font-bold text-purple-700 dark:text-purple-400">AI 紫微斗数</h1>
            <div className="w-16" /> {/* 占位 */}
          </div>

          {currentPage === '命盘显示' ? (
            <ChartView
              ziweiData={ziweiData}
              birthData={birthData}
              selectedDecadal={selectedDecadal}
              setSelectedDecadal={setSelectedDecadal}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              savedCases={savedCases}
              showSavedCases={showSavedCases}
              setShowSavedCases={setShowSavedCases}
              onSaveCase={handleSaveCurrentCase}
              onLoadCase={handleLoadSavedCase}
              onDeleteCase={handleDeleteSavedCase}
              onYearChange={(year) => {
                handleHoroscopeDateChange(new Date(year, 0, 1));
              }}
              onTestAIPrompt={handleTestAIPrompt}
            />
          ) : currentPage === 'AI 命理师' ? (
            <div className="h-full">
              <AIFortuneTeller
                messages={messages}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                isLoading={isLoading}
                debugPrompt={debugPrompt}
                showDebug={showDebug}
                setShowDebug={setShowDebug}
                selectedModel={selectedModel}
                hasBirthData={hasBirthData}
                birthData={birthData}
                messagesEndRef={messagesEndRef}
                messagesContainerRef={messagesContainerRef}
                onSendMessage={() => sendMessage(selectedModel)}
                onKeyPress={handleKeyPress}
                onSaveHistory={() => saveChatHistory(birthData?.birthday || '', birthData?.gender || '')}
                onLoadHistory={loadChatHistory}
                setMessages={setMessages}
                selectedPersona={selectedPersona}
                onPersonaChange={setSelectedPersona}
                ziweiData={ziweiData}
                initializeChat={initializeChat}
                stopGeneration={stopGeneration}
              />
            </div>
          ) : (
            <RagTest onBack={() => setCurrentPage('AI 命理师')} />
          )}
        </main>
      </div>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2a2a] border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setCurrentPage('命盘显示')}
            className={`flex flex-col items-center p-2 ${currentPage === '命盘显示' ? 'text-purple-600' : 'text-gray-600'}`}
          >
            <span className="text-lg">📊</span>
            <span className="text-xs">命盘</span>
          </button>
          <button
            onClick={() => setCurrentPage('AI 命理师')}
            className={`flex flex-col items-center p-2 ${currentPage === 'AI 命理师' ? 'text-purple-600' : 'text-gray-600'}`}
          >
            <span className="text-lg">🤖</span>
            <span className="text-xs">AI</span>
          </button>
          <button
            onClick={() => setCurrentPage('RAG 测试')}
            className={`flex flex-col items-center p-2 ${currentPage === 'RAG 测试' ? 'text-purple-600' : 'text-gray-600'}`}
          >
            <span className="text-lg">🔍</span>
            <span className="text-xs">RAG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
