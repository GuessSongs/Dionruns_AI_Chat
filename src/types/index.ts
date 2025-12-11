// 消息类型定义
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}

// 预设类型定义
export interface Preset {
  id: string;
  name: string;
  content: string;
}

// 聊天设置类型定义
export interface ChatSettings {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  presets: Preset[];
  selectedPreset: string;
}

// API响应类型定义
export interface APIResponse {
  code: number;
  msg: string;
  data?: {
    content: string;
  };
}