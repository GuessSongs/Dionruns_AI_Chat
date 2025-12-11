import { APIResponse } from '@/types';

// 智谱AI API相关常量
const API_CONFIG = {
  BASE_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  // 智谱AI使用直接的API Key认证，不需要生成访问令牌
};

// 发送消息到智谱AI API
export const sendMessageToAPI = async (
  message: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string = ''
): Promise<string> => {
  try {
    // 检查API Key是否为空
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }
    
    // 构建符合智谱AI格式的请求体
    const requestBody = {
      model: model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: message }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false, // 不使用流式响应
    };
    
    console.log('发送请求到智谱AI:', {
      url: API_CONFIG.BASE_URL,
      model: model,
      messageLength: message.length
    });
    
    // 发送请求到智谱AI
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`, // 智谱AI使用Bearer token认证
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // 根据状态码提供更具体的错误信息
      if (response.status === 400) {
        throw new Error('请求格式错误，请检查模型名称和参数设置');
      } else if (response.status === 401) {
        throw new Error('API Key无效，请检查您的API Key是否正确');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (response.status === 500) {
        throw new Error('服务器内部错误，请稍后再试');
      } else {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('收到API响应:', data);
    
    // 智谱AI的响应格式
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message?.content;
      if (content) {
        return content;
      } else {
        throw new Error('API返回的内容为空');
      }
    } else {
      throw new Error('API响应格式异常');
    }
    
  } catch (error) {
    console.error('API调用错误:', error);
    
    // 如果是网络错误，提供更友好的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    }
    
    throw error;
  }
};