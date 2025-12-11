// 消息类型定义
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  files?: Array<{
    name: string;
    type: 'image' | 'document';
    url: string;
  }>;
}

// 对话类型定义
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
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

// 智谱AI API响应类型定义（根据官方文档）
export interface ZhipuAPIResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string; // 推理内容
    };
    finish_reason: 'stop' | 'length' | 'sensitive' | 'network_error';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  content_filter?: Array<{
    role: string;
    level: number;
  }>;
}

// 兼容的API响应类型定义（保留向后兼容）
export interface APIResponse {
  code: number;
  msg: string;
  data?: {
    content: string;
  };
}