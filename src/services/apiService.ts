import { APIResponse } from '@/types';

// API相关常量
const API_CONFIG = {
  BASE_URL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/',
  // 注意：实际使用时需要替换为真实的API Key和Secret Key
  // 这里仅作为示例，实际应用中请从设置中获取
};

// 生成访问令牌（模拟实现，实际应该调用百度云的鉴权接口）
const generateAccessToken = async (apiKey: string): Promise<string> => {
  // 这里是模拟的令牌生成过程
  // 实际应用中，应该调用百度云的oauth/token接口获取真实的访问令牌
  
  // 简单的校验，确保API Key不为空
  if (!apiKey) {
    throw new Error('API Key不能为空');
  }
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回模拟的令牌（实际应用中应该返回真实的令牌）
  return `mock_access_token_${Date.now()}`;
};

// 发送消息到API
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
    
    // 生成访问令牌
    const accessToken = await generateAccessToken(apiKey);
    
    // 构建API请求URL
    const url = `${API_CONFIG.BASE_URL}${model}?access_token=${accessToken}`;
    
    // 构建请求体
    const requestBody = {
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: message }
      ],
      temperature,
      max_tokens: maxTokens,
    };
    
    // 发送请求
    // 注意：这里使用的是模拟数据，实际应用中应该发送真实的API请求
    // 由于是模拟环境，我们直接返回预设的响应
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 模拟API响应
    const mockResponses: Record<string, string[]> = {
      '你好': [
        '你好！很高兴为您服务。有什么可以帮助您的吗？',
        '您好！我是AI客服助手，请问有什么可以帮到您的？',
        '嗨！欢迎使用AI客服，请问您需要什么帮助？'
      ],
      '你是谁': [
        '我是一个AI客服助手，由智谱清言提供技术支持。',
        '我是您的智能助手，很高兴能为您提供服务。',
        '我是基于先进AI技术开发的客服机器人。'
      ],
      '天气': [
        '很抱歉，我目前无法直接获取天气信息。您可以尝试提供具体的城市名称，或者使用专门的天气服务。',
        '我没有实时天气数据的访问权限。建议您使用天气预报应用或网站获取最新信息。',
        '对不起，我无法为您提供当前的天气情况。请尝试使用专业的天气查询工具。'
      ],
      '帮助': [
        '我可以回答您的问题、提供信息或者协助您完成一些任务。您可以直接向我提问。',
        '请问您需要什么帮助？我可以为您提供信息查询、问题解答等服务。',
        '有什么我可以帮您的吗？请随时告诉我您的需求。'
      ]
    };
    
    // 根据消息内容选择响应
    let responseContent = '感谢您的提问！我是AI客服助手，很高兴为您服务。';
    
    // 检查是否有匹配的问题
    for (const [key, responses] of Object.entries(mockResponses)) {
      if (message.includes(key)) {
        responseContent = responses[Math.floor(Math.random() * responses.length)];
        break;
      }
    }
    
    // 返回响应内容
    return responseContent;
    
    // 以下是实际API调用的代码（注释掉，因为是模拟环境）
    /*
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data: APIResponse = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`API返回错误: ${data.msg}`);
    }
    
    if (!data.data?.content) {
      throw new Error('API返回的内容为空');
    }
    
    return data.data.content;
    */
  } catch (error) {
    console.error('API调用错误:', error);
    throw error;
  }
};