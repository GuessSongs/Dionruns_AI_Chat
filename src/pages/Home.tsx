import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Settings, Send, Mic, Paperclip, X, SendHorizontal, RotateCcw, Download } from 'lucide-react';
import { SettingsModal } from '@/components/SettingsModal';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import { ConversationList } from '@/components/ConversationList';
import { GenerativeInput } from '@/components/GenerativeInput';
import { ExportModal } from '@/components/ExportModal';
import { Message, ChatSettings, Preset, Conversation } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { 
  clearChat, 
  getChatMessages, 
  getSettings, 
  saveChatMessages, 
  saveSettings,
  getConversations,
  saveConversation,
  deleteConversation,
  createNewConversation,
  getCurrentConversationId,
  setCurrentConversationId
} from '@/services/storageService';
import { sendMessageToAPI } from '@/services/apiService';
import { generateImage, generateVideo, getVideoResult } from '@/services/generativeApiService';
import { fileToBase64 } from '@/lib/utils';

export default function Home() {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    apiKey: '',
    model: 'glm-4v-flash',
    temperature: 0.8, // 官方默认值
    maxTokens: 1024, // 建议不小于1024
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
    const savedSettings = getSettings();
    const savedConversations = getConversations();
    const currentConversationId = getCurrentConversationId();
    
    if (savedSettings) {
      setSettings(savedSettings);
    }
    
    setConversations(savedConversations);
    
    // 恢复当前对话或创建新对话
    if (currentConversationId) {
      const conversation = savedConversations.find(c => c.id === currentConversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else {
        // 如果当前对话不存在，创建新对话
        handleNewConversation();
      }
    } else if (savedConversations.length > 0) {
      // 如果没有当前对话但有历史对话，选择最新的
      const latestConversation = savedConversations[0];
      setCurrentConversation(latestConversation);
      setCurrentConversationId(latestConversation.id);
    } else {
      // 如果没有任何对话，创建新对话
      handleNewConversation();
    }
  }, []);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // 对话管理函数
  const handleNewConversation = () => {
    const newConversation = createNewConversation();
    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: '您好！我是您的AI客服助手。请问有什么可以帮助您的吗？',
      sender: 'ai',
      timestamp: new Date(),
    };
    newConversation.messages = [welcomeMessage];
    
    // 清空输入框
    setInputValue('');
    
    setCurrentConversation(newConversation);
    setCurrentConversationId(newConversation.id);
    saveConversation(newConversation);
    
    // 更新对话列表
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    
    toast.success('已创建新对话');
  };

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      setCurrentConversationId(conversationId);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    deleteConversation(conversationId);
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    
    // 如果删除的是当前对话
    if (currentConversation?.id === conversationId) {
      if (updatedConversations.length > 0) {
        // 选择第一个对话
        const firstConversation = updatedConversations[0];
        setCurrentConversation(firstConversation);
        setCurrentConversationId(firstConversation.id);
      } else {
        // 如果没有对话了，创建新对话
        handleNewConversation();
      }
    }
    
    toast.success('对话已删除');
  };

  const saveCurrentConversation = () => {
    if (currentConversation) {
      saveConversation(currentConversation);
      // 更新对话列表中的对话
      const updatedConversations = conversations.map(c => 
        c.id === currentConversation.id ? currentConversation : c
      );
      setConversations(updatedConversations);
    }
  };

  // 判断是否为生成模型
  const isGenerativeModel = (model: string) => {
    return model === 'cogview-3-flash' || model === 'cogvideox-flash';
  };

  // 处理生成请求
  const handleGenerate = async (prompt: string, options?: any) => {
    if (!currentConversation || isLoading) return;

    setIsLoading(true);

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: prompt,
      sender: 'user',
      timestamp: new Date(),
    };

    // 更新当前对话
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
    };
    setCurrentConversation(updatedConversation);

    try {
      if (settings.model === 'cogview-3-flash') {
        // 图片生成
        const imageUrl = await generateImage(
          prompt,
          settings.apiKey,
          options?.quality || 'standard',
          options?.size || '1024x1024'
        );

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: '图片生成完成！',
          sender: 'ai',
          timestamp: new Date(),
          files: [{
            name: '生成的图片.jpg',
            type: 'image',
            url: imageUrl
          }]
        };

        const finalConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, aiMessage],
          updatedAt: new Date(),
        };
        setCurrentConversation(finalConversation);
        saveConversation(finalConversation);

      } else if (settings.model === 'cogvideox-flash') {
        // 视频生成
        let imageUrl: string | undefined;
        
        // 如果有图片文件，转换为base64
        if (options?.imageFile) {
          imageUrl = await fileToBase64(options.imageFile);
        }

        const { taskId } = await generateVideo(
          prompt,
          settings.apiKey,
          imageUrl,
          options?.quality || 'speed',
          options?.withAudio || false
        );

        // 创建等待消息
        const waitingMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `视频生成任务已提交，任务ID: ${taskId}\n正在生成中，请稍候...`,
          sender: 'ai',
          timestamp: new Date(),
        };

        const waitingConversation = {
          ...updatedConversation,
          messages: [...updatedConversation.messages, waitingMessage],
          updatedAt: new Date(),
        };
        setCurrentConversation(waitingConversation);
        saveConversation(waitingConversation);

        // 轮询查询结果
        const pollResult = async () => {
          try {
            const result = await getVideoResult(taskId, settings.apiKey);
            
            if (result.status === 'SUCCESS' && result.videoUrl) {
              // 生成成功
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                content: '视频生成完成！',
                sender: 'ai',
                timestamp: new Date(),
                files: [{
                  name: '生成的视频.mp4',
                  type: 'document', // 暂时用document类型
                  url: result.videoUrl
                }]
              };

              const successConversation = {
                ...waitingConversation,
                messages: [...waitingConversation.messages, successMessage],
                updatedAt: new Date(),
              };
              setCurrentConversation(successConversation);
              saveConversation(successConversation);
              
            } else if (result.status === 'FAIL') {
              // 生成失败
              const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                content: `视频生成失败: ${result.error || '未知错误'}`,
                sender: 'ai',
                timestamp: new Date(),
                isError: true,
              };

              const errorConversation = {
                ...waitingConversation,
                messages: [...waitingConversation.messages, errorMessage],
                updatedAt: new Date(),
              };
              setCurrentConversation(errorConversation);
              saveConversation(errorConversation);
              
            } else if (result.status === 'PROCESSING') {
              // 仍在处理中，继续轮询
              setTimeout(pollResult, 5000); // 5秒后再次查询
            }
          } catch (error) {
            console.error('查询视频结果失败:', error);
            const errorMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: `查询视频结果失败: ${error instanceof Error ? error.message : '未知错误'}`,
              sender: 'ai',
              timestamp: new Date(),
              isError: true,
            };

            const errorConversation = {
              ...waitingConversation,
              messages: [...waitingConversation.messages, errorMessage],
              updatedAt: new Date(),
            };
            setCurrentConversation(errorConversation);
            saveConversation(errorConversation);
          }
        };

        // 开始轮询
        setTimeout(pollResult, 3000); // 3秒后开始查询
      }

      // 更新对话列表
      const updatedConversations = conversations.map(c => 
        c.id === currentConversation.id ? currentConversation : c
      );
      setConversations(updatedConversations);

    } catch (error) {
      console.error('生成失败:', error);
      toast.error(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };
      
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(errorConversation);
      saveConversation(errorConversation);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (files?: any[]) => {
    if ((!inputValue.trim() && (!files || files.length === 0)) || isLoading || !currentConversation) return;
    
    // 调试日志
    console.log('发送消息:', {
      hasText: !!inputValue.trim(),
      hasFiles: !!(files && files.length > 0),
      filesCount: files?.length || 0,
      model: settings.model
    });
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      files: files?.map(f => ({
        name: f.file.name,
        type: f.type,
        url: f.url
      }))
    };
    
    // 更新当前对话
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date(),
    };
    setCurrentConversation(updatedConversation);
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
        presetContent,
        files
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      // 更新当前对话
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(finalConversation);
      saveConversation(finalConversation);
      
      // 更新对话列表（从存储中重新获取以确保标题更新）
      const refreshedConversations = getConversations();
      setConversations(refreshedConversations);
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
      
      // 更新当前对话
      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(errorConversation);
      saveConversation(errorConversation);
      
      // 更新对话列表
      const refreshedConversations = getConversations();
      setConversations(refreshedConversations);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空当前对话
  const handleClearChat = () => {
    if (!currentConversation) return;
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: '您好！我是您的AI客服助手。请问有什么可以帮助您的吗？',
      sender: 'ai',
      timestamp: new Date(),
    };
    
    const clearedConversation = {
      ...currentConversation,
      messages: [welcomeMessage],
      updatedAt: new Date(),
    };
    
    setCurrentConversation(clearedConversation);
    saveConversation(clearedConversation);
    
    // 更新对话列表
    const updatedConversations = conversations.map(c => 
      c.id === clearedConversation.id ? clearedConversation : c
    );
    setConversations(updatedConversations);
    
    toast.success('当前对话已清空');
  };

  // 保存设置
  const handleSaveSettings = (newSettings: ChatSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setIsSettingsOpen(false);
    toast.success('设置已保存');
  };

  return (
    <div className={`flex h-screen bg-${theme === 'dark' ? 'gray-900' : 'gray-50'} text-${theme === 'dark' ? 'gray-100' : 'gray-900'} transition-colors duration-300`}>
      {/* 对话列表侧边栏 */}
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onExportConversations={() => setIsExportModalOpen(true)}
        isCollapsed={isConversationListCollapsed}
        onToggleCollapse={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
      />
      
      {/* 主聊天区域 */}
      <div className="flex flex-col flex-1">
        {/* 头部 */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {isGenerativeModel(settings.model) ? 'AI内容生成' : 'AI客服助手'}
              </h1>
              {currentConversation && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentConversation.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="导出对话"
              disabled={conversations.length === 0}
            >
              <Download size={20} />
            </button>
            <button 
              onClick={handleClearChat}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="清空当前对话"
              disabled={!currentConversation}
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
        
        {/* 内容区域 - 根据模型类型调整布局 */}
        {isGenerativeModel(settings.model) ? (
          // 生成模型：左右布局
          <div className="flex flex-1 overflow-hidden">
            {/* 左侧：对话历史 */}
            <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-medium text-sm">生成历史</h3>
              </div>
              <main 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4"
              >
                {currentConversation ? (
                  <>
                    <MessageList messages={currentConversation.messages} isLoading={isLoading} />
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <p>请选择或创建一个对话</p>
                  </div>
                )}
              </main>
            </div>
            
            {/* 右侧：生成控制面板 */}
            <div className="w-96 flex flex-col bg-white dark:bg-gray-800">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-medium text-sm">
                  {settings.model === 'cogview-3-flash' ? '图片生成' : '视频生成'}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <GenerativeInput
                  model={settings.model}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          // 对话模型：传统布局
          <>
            <main 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4"
            >
              {currentConversation ? (
                <>
                  <MessageList messages={currentConversation.messages} isLoading={isLoading} />
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p>请选择或创建一个对话</p>
                </div>
              )}
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
          </>
        )}
      </div>
      
      {/* 设置模态框 */}
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* 导出模态框 */}
      {isExportModalOpen && (
        <ExportModal
          conversations={conversations}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}