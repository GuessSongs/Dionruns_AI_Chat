import { Message, ChatSettings } from '@/types';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';

// 存储键名常量
const STORAGE_KEYS = {
  CHAT_MESSAGES: 'ai_chat_messages',
  CHAT_SETTINGS: 'ai_chat_settings',
};

// 默认设置
const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: '',
  model: 'GLM-4.1V-Thinking',
  temperature: 0.7,
  maxTokens: 2048,
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

// 清空聊天记录
export const clearChat = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
};