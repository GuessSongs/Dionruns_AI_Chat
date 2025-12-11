import { Message, ChatSettings, Conversation } from '@/types';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';

// 存储键名常量
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'ai_chat_messages', // 保留兼容性
  CHAT_SETTINGS: 'ai_chat_settings',
  CONVERSATIONS: 'ai_conversations',
  CURRENT_CONVERSATION: 'ai_current_conversation',
};

// 默认设置（根据官方文档默认值）
const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: '',
  model: 'glm-4.1v-thinking-flash',
  temperature: 0.8, // 官方默认值
  maxTokens: 1024, // 建议不小于1024
  presets: [
    { id: '1', name: '客服助手', content: '你是一个专业的客服助手，需要礼貌、专业地回答用户问题。' },
    { id: '2', name: '技术顾问', content: '你是一个技术专家，需要提供详细、准确的技术解答。' },
  ],
  selectedPreset: '1',
};

// 获取聊天消息
export const getChatMessages = (): Message[] => {
  const messages = getFromLocalStorage<any[]>(STORAGE_KEYS.CHAT_MESSAGES, []);
  
  // 将存储的ISO字符串转换回Date对象
  return messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));
};

// 保存聊天消息
export const saveChatMessages = (messages: Message[]): void => {
  // 转换Date对象为ISO字符串以便存储
  const serializableMessages = messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
  }));
  
  saveToLocalStorage(STORAGE_KEYS.CHAT_MESSAGES, serializableMessages);
};

// 获取聊天设置
export const getSettings = (): ChatSettings => {
  return getFromLocalStorage<ChatSettings>(STORAGE_KEYS.CHAT_SETTINGS, DEFAULT_SETTINGS);
};

// 保存聊天设置
export const saveSettings = (settings: ChatSettings): void => {
  saveToLocalStorage(STORAGE_KEYS.CHAT_SETTINGS, settings);
};

// 清空聊天记录（保留兼容性）
export const clearChat = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
};

// === 对话管理功能 ===

// 生成对话标题
const generateConversationTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.sender === 'user');
  if (firstUserMessage && firstUserMessage.content.trim()) {
    const title = firstUserMessage.content.trim().slice(0, 30);
    return title.length < firstUserMessage.content.trim().length ? title + '...' : title;
  }
  return '新对话';
};

// 获取所有对话
export const getConversations = (): Conversation[] => {
  const conversations = getFromLocalStorage<any[]>(STORAGE_KEYS.CONVERSATIONS, []);
  
  return conversations.map(conv => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
    messages: conv.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  }));
};

// 保存对话
export const saveConversation = (conversation: Conversation): void => {
  const conversations = getConversations();
  const existingIndex = conversations.findIndex(c => c.id === conversation.id);
  
  // 如果标题是"新对话"，尝试重新生成标题
  let title = conversation.title;
  if (title === '新对话' || !title) {
    const generatedTitle = generateConversationTitle(conversation.messages);
    title = generatedTitle;
  }
  
  const conversationToSave: any = {
    ...conversation,
    title: title,
    updatedAt: new Date(),
    createdAt: conversation.createdAt || new Date(),
    messages: conversation.messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
    }))
  };
  
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversationToSave;
  } else {
    conversations.push(conversationToSave);
  }
  
  // 按更新时间排序
  conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  saveToLocalStorage(STORAGE_KEYS.CONVERSATIONS, conversations);
};

// 删除对话
export const deleteConversation = (conversationId: string): void => {
  const conversations = getConversations();
  const filteredConversations = conversations.filter(c => c.id !== conversationId);
  saveToLocalStorage(STORAGE_KEYS.CONVERSATIONS, filteredConversations);
};

// 创建新对话
export const createNewConversation = (): Conversation => {
  return {
    id: Date.now().toString(),
    title: '新对话',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// 获取当前对话ID
export const getCurrentConversationId = (): string | null => {
  return getFromLocalStorage<string | null>(STORAGE_KEYS.CURRENT_CONVERSATION, null);
};

// 设置当前对话ID
export const setCurrentConversationId = (conversationId: string): void => {
  saveToLocalStorage(STORAGE_KEYS.CURRENT_CONVERSATION, conversationId);
};

// === 导出功能 ===

// 导出选中的对话
export const exportConversations = (conversationIds: string[]): void => {
  const allConversations = getConversations();
  const selectedConversations = allConversations.filter(conv => 
    conversationIds.includes(conv.id)
  );

  if (selectedConversations.length === 0) {
    throw new Error('没有选择要导出的对话');
  }

  // 准备导出数据
  const exportData = {
    exportTime: new Date().toISOString(),
    version: '1.0',
    totalConversations: selectedConversations.length,
    conversations: selectedConversations.map(conv => ({
      ...conv,
      // 确保日期格式正确
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      messages: conv.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
      }))
    }))
  };

  // 创建文件名
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const filename = selectedConversations.length === 1 
    ? `AI对话-${selectedConversations[0].title.slice(0, 20)}-${timestamp}.json`
    : `AI对话导出-${selectedConversations.length}个对话-${timestamp}.json`;

  // 下载文件
  downloadJSON(exportData, filename);
};

// 导出所有对话
export const exportAllConversations = (): void => {
  const allConversations = getConversations();
  const conversationIds = allConversations.map(conv => conv.id);
  exportConversations(conversationIds);
};

// 下载JSON文件的工具函数
const downloadJSON = (data: any, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  URL.revokeObjectURL(url);
};