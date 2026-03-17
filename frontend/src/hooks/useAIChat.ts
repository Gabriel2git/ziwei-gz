import { useRef, useState } from 'react';
import { Message, PersonaType, generateMasterPrompt, getDefaultSystemPrompt, getLLMResponse } from '@/lib/ai';
import type { ContextStatus, ZiweiData } from '@/types';

type LoadingStage = 'context' | 'model';

export function useAIChat(
  ziweiData: ZiweiData | null,
  horoscopeYear: number,
  resolveZiweiData?: () => Promise<ZiweiData | null>,
  contextStatus: ContextStatus = 'idle',
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('model');
  const [debugPrompt, setDebugPrompt] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('companion');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const initializeChat = (data: ZiweiData, persona?: PersonaType) => {
    const currentPersona = persona || selectedPersona;
    const fullPrompt = generateMasterPrompt('请分析我的命盘', data, data?.targetYear || horoscopeYear, currentPersona);

    setMessages([
      { role: 'system', content: fullPrompt },
      {
        role: 'assistant',
        content:
          contextStatus === 'ready'
            ? '你好，我已经读取你的完整命盘、大限和流年上下文。你可以直接开始提问。'
            : '你好，我已经加载命盘主数据，完整大限流年上下文正在后台准备。你可以先看命盘，提问时我会自动补全上下文。',
      },
    ]);
    setDebugPrompt(`=== 系统提示词 ===\n${fullPrompt}`);
  };

  const updateChatForHoroscope = (data: ZiweiData) => {
    const fullPrompt = generateMasterPrompt('请分析我的命盘', data, data?.targetYear || horoscopeYear, selectedPersona);

    setMessages([
      { role: 'system', content: fullPrompt },
      {
        role: 'assistant',
        content:
          contextStatus === 'ready'
            ? '已根据你最新选择的大限/流年更新完整解盘上下文。'
            : '命盘年份已切换，完整 AI 上下文正在后台刷新。提问时我会自动等待上下文准备完成。',
      },
    ]);
    setDebugPrompt(`=== 系统提示词 ===\n${fullPrompt}`);
  };

  const sendMessage = async (model: string) => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);
    setLoadingStage('context');

    abortControllerRef.current = new AbortController();

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      const resolvedZiweiData = resolveZiweiData ? await resolveZiweiData() : ziweiData;
      setLoadingStage('model');

      const systemPrompt = resolvedZiweiData
        ? generateMasterPrompt(
            inputMessage,
            resolvedZiweiData,
            resolvedZiweiData.targetYear || horoscopeYear,
            selectedPersona,
          )
        : getDefaultSystemPrompt();

      const dynamicMessages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...newMessages.filter((message) => message.role !== 'system'),
      ];

      const stream = await getLLMResponse(dynamicMessages, model, abortControllerRef.current.signal);
      if (!stream) throw new Error('Failed to get response stream');

      reader = stream.getReader();
      const decoder = new TextDecoder();
      let aiResponseContent = '';

      const tempMessageIndex = newMessages.length;
      setMessages([...newMessages, { role: 'assistant', content: '' }]);
      setDebugPrompt(`=== 系统提示词 ===\n${systemPrompt}`);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!value) continue;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            const delta = data?.choices?.[0]?.delta?.content;
            if (!delta) continue;

            aiResponseContent += delta;
            setMessages((prev) => {
              const updated = [...prev];
              updated[tempMessageIndex] = { role: 'assistant', content: aiResponseContent };
              return updated;
            });
          } catch {
            // Ignore malformed stream lines.
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const assistantIndex = newMessages.length;
          if (updated[assistantIndex]) {
            updated[assistantIndex] = {
              role: 'assistant',
              content: `${updated[assistantIndex].content}\n\n[用户已终止生成]`,
            };
          }
          return updated;
        });
      } else {
        setMessages((prev) => {
          const updated = [...prev];
          const assistantMessage = {
            role: 'assistant' as const,
            content: `抱歉，AI 服务调用失败。\n\n错误详情: ${error instanceof Error ? error.message : '未知错误'}`,
          };

          if (updated.length > newMessages.length) {
            updated[newMessages.length] = assistantMessage;
          } else {
            updated.push(assistantMessage);
          }

          return updated;
        });
      }
    } finally {
      if (reader) {
        try {
          reader.releaseLock();
        } catch {
          // Ignore release errors.
        }
      }
      setIsLoading(false);
      setLoadingStage('model');
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const saveChatHistory = (birthDate: string, gender: string) => {
    if (messages.length === 0) return;

    const chatData = {
      birth_date: birthDate,
      gender,
      messages: messages.filter((message) => message.role !== 'system'),
      timestamp: new Date().toLocaleString('zh-CN'),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ziwei_chat_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadChatHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const chatData = JSON.parse(e.target?.result as string);
        if (chatData.messages) {
          setMessages(chatData.messages);
        }
      } catch (error) {
        console.error('加载聊天历史失败:', error);
        alert('聊天历史文件格式错误');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    loadingStage,
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
    stopGeneration,
  };
}
