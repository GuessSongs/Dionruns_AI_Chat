import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Settings, Send, Mic, Paperclip, X, SendHorizontal, RotateCcw } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { Message, ChatSettings, Preset } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { clearChat, getChatMessages, getSettings, saveChatMessages, saveSettings } from '@/services/storageService';
import { sendMessageToAPI } from '@/services/apiService';

export default function Home() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    apiKey: '',
    model: 'GLM-4.1V-Thinking',
    temperature: 0.7,
    maxTokens: 2048,
    presets: [
      { id: '1', name: '客服助手', content: '你是一个专业的客服助手，需要礼貌、专业地回答用户问题。' },
      { id: '2', name: '技术顾问', content: '你是一个技术专家，需要提供详细、准确的技术解答。' },
    ],
    selectedPreset: '1',
  });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化加载数据
  useEffect(() => {
    const savedMessages = getChatMessages();
    const savedSettings = getSettings();
    
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
    
    if (savedSettings) {
      setSettings(savedSettings);
    }
    
    // 添加欢迎消息
    if (savedMessages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: '您好！我是您的AI客服助手。请问有什么可以帮助您的吗？',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      saveChatMessages([welcomeMessage]);
    }
  }, []);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // 获取选中的预设内容
      const selectedPreset = settings.presets.find(p => p.id === settings.selectedPreset);
      const presetContent = selectedPreset?.content || '';
      
      // 调用API发送消息
      const aiResponse = await sendMessageToAPI(
        inputValue.trim(),
        settings.apiKey,
        settings.model,
        settings.temperature,
        settings.maxTokens,
        presetContent
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      saveChatMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('API调用错误:', error);
      toast.error('消息发送失败，请检查您的API Key和网络连接');
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: '很抱歉，我暂时无法为您提供回答。请稍后再试，或检查您的设置。',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空聊天记录
  const handleClearChat = () => {
    clearChat();
    setMessages([]);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: '您好！我是您的AI客服助手。请问有什么可以帮助您的吗？',
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    saveChatMessages([welcomeMessage]);
    toast.success('聊天记录已清空');
  };

  // 保存设置
  const handleSaveSettings = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsSettingsOpen(false);
    toast.success('设置已保存');
  };

  return (
    <div className={`flex flex-col h-screen bg-${theme === 'dark' ? 'gray-900' : 'gray-50'} text-${theme === 'dark' ? 'gray-100' : 'gray-900'} transition-colors duration-300`}>
      {/* 头部 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <h1 className="text-xl font-bold">AI客服助手</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="清空聊天"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {/* 聊天内容区域 */}
      <main 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </main>
      
      {/* 输入区域 */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput 
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </footer>
      
      {/* 设置模态框 */}
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}