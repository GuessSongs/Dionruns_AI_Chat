import { APIResponse } from '@/types';
import { fileToBase64 } from '@/lib/utils';

// 智谱AI API相关常量
const API_CONFIG = {
  BASE_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  // 智谱AI使用直接的API Key认证，不需要生成访问令牌
};

// 文件预览接口
interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'document';
}

// 发送消息到智谱AI API
export const sendMessageToAPI = async (
  message: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string = '',
  files?: FilePreview[]
): Promise<string> => {
  try {
    // 检查API Key是否为空
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }
    
    // 检查模型类型，图像和视频生成模型使用不同的API端点
    if (model.includes('cogview') || model.includes('cogvideox')) {
      throw new Error(`模型 ${model} 用于图像/视频生成，请选择GLM系列模型进行对话`);
    }
    
    // 检查是否尝试用非多模态模型发送图片
    if (files && files.length > 0 && !model.includes('4v')) {
      throw new Error(`模型 ${model} 不支持图像理解，请选择 glm-4v-flash 模型来处理图片`);
    }
    
    // 检查GLM-4V-Flash模型的base64限制
    if (files && files.length > 0 && model === 'glm-4v-flash') {
      throw new Error(`GLM-4V-Flash 模型不支持本地图片上传（不支持base64编码）。\n\n解决方案：\n1. 使用在线图片URL代替本地图片\n2. 等待支持base64的多模态模型\n3. 使用付费版本的GLM-4V模型`);
    }

    // 构建用户消息内容
    const userContent: any[] = [];
    
    // 添加文件内容（图片）
    if (files && files.length > 0) {
      console.log('处理文件数量:', files.length);
      for (const filePreview of files) {
        if (filePreview.type === 'image') {
          try {
            // 检查图片大小（5MB限制）
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (filePreview.file.size > maxSize) {
              throw new Error(`图片大小超过5MB限制，当前大小: ${(filePreview.file.size / 1024 / 1024).toFixed(2)}MB`);
            }
            
            console.log('转换图片为base64:', filePreview.file.name, `(${(filePreview.file.size / 1024).toFixed(1)}KB)`);
            const base64Data = await fileToBase64(filePreview.file);
            console.log('图片转换成功，base64长度:', base64Data.length);
            
            userContent.push({
              type: 'image_url',
              image_url: {
                url: base64Data
              }
            });
          } catch (error) {
            console.error('Failed to convert image to base64:', error);
            throw new Error(error instanceof Error ? error.message : '图片处理失败，请重试');
          }
        }
      }
    }
    
    // 检测文本中的图片URL并分离处理
    if (message.trim()) {
      const text = message.trim();
      
      if (model === 'glm-4v-flash') {
        // 对于GLM-4V-Flash，检测并分离图片URL
        const words = text.split(/\s+/);
        const imageUrls = [];
        const textWords = [];
        
        words.forEach(word => {
          // 检测是否为图片URL
          if (word.match(/^https?:\/\/[^\s]+/i) && 
              (word.includes('.jpg') || word.includes('.jpeg') || word.includes('.png') || 
               word.includes('.gif') || word.includes('.webp') || word.includes('image') || 
               word.includes('img') || word.includes('photo'))) {
            imageUrls.push(word);
          } else {
            textWords.push(word);
          }
        });
        
        // 添加检测到的图片URL
        if (imageUrls.length > 0) {
          console.log('检测到图片URL:', imageUrls);
          imageUrls.forEach(url => {
            userContent.push({
              type: 'image_url',
              image_url: {
                url: url
              }
            });
          });
        }
        
        // 添加文本内容
        const remainingText = textWords.join(' ').trim();
        if (remainingText) {
          userContent.push({
            type: 'text',
            text: remainingText
          });
        } else if (imageUrls.length > 0) {
          // 如果有图片但没有文本，添加默认提示
          userContent.push({
            type: 'text',
            text: '请分析这张图片'
          });
        } else {
          // 没有图片URL，作为普通文本处理
          userContent.push({
            type: 'text',
            text: text
          });
        }
      } else {
        // 非GLM-4V-Flash模型，普通文本处理
        userContent.push({
          type: 'text',
          text: text
        });
      }
    }
    
    // 如果没有任何内容，抛出错误
    if (userContent.length === 0) {
      throw new Error('请输入消息内容或选择文件');
    }

    // 构建符合智谱AI官方格式的请求体
    const hasImages = userContent.some(c => c.type === 'image_url');
    const messages = [];
    
    // 对于多模态请求，不添加系统提示
    if (systemPrompt && !hasImages) {
      messages.push({ role: 'assistant', content: systemPrompt });
    }
    
    messages.push({ 
      role: 'user', 
      content: userContent
    });
    
    const requestBody = {
      model: model,
      messages: messages,
      temperature: typeof temperature === 'string' ? parseFloat(temperature) : temperature,
      max_tokens: typeof maxTokens === 'string' ? parseInt(maxTokens, 10) : maxTokens,
      stream: false, // 使用同步调用
      do_sample: true, // 启用采样策略
      top_p: 0.6 // 默认值
    };
    
    console.log('发送请求到智谱AI:', {
      url: API_CONFIG.BASE_URL,
      model: model,
      messageLength: message.length,
      userContentLength: userContent.length,
      hasImages: userContent.some(c => c.type === 'image_url')
    });
    
    // 临时调试：显示完整请求体（但不显示base64数据）
    const debugRequestBody = {
      ...requestBody,
      messages: requestBody.messages.map(msg => ({
        ...msg,
        content: Array.isArray(msg.content) 
          ? msg.content.map(c => c.type === 'image_url' 
              ? { ...c, image_url: { url: '[BASE64_DATA_HIDDEN]' } } 
              : c)
          : msg.content
      }))
    };
    console.log('请求体结构:', JSON.stringify(debugRequestBody, null, 2));
    
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
      
      // 尝试解析错误响应
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
          
          // 针对特定错误提供更友好的提示
          if (errorMessage.includes('不支持SYNC调用方式')) {
            errorMessage = '当前模型不支持标准聊天对话，请选择GLM-4系列模型';
          } else if (errorMessage.includes('模型不存在')) {
            errorMessage = '模型不存在，请检查模型名称是否正确，建议使用glm-4-flash等标准模型';
          } else if (errorMessage.includes('API key')) {
            errorMessage = 'API Key无效，请检查您的API Key是否正确';
          }
        }
      } catch (e) {
        // 如果无法解析错误响应，使用默认错误信息
      }
      
      // 根据状态码提供更具体的错误信息
      if (response.status === 400) {
        throw new Error(errorMessage);
      } else if (response.status === 401) {
        throw new Error('API Key无效，请检查您的API Key是否正确');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (response.status === 500) {
        throw new Error('服务器内部错误，请稍后再试');
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    console.log('收到API响应:', data);
    
    // 智谱AI的响应格式处理
    if (data.choices && data.choices.length > 0) {
      const choice = data.choices[0];
      const message = choice.message;
      
      if (message && message.content) {
        // 处理推理内容和最终答案
        let finalContent = message.content;
        
        // 如果有推理内容，可以选择是否显示
        if (message.reasoning_content) {
          // 可以选择显示推理过程
          finalContent = `推理过程：\n${message.reasoning_content}\n\n最终答案：\n${message.content}`;
        }
        
        // 处理特殊Token标记（答案高亮）
        finalContent = finalContent.replace(
          /<\|begin_of_box\|>(.*?)<\|end_of_box\|>/g, 
          '**$1**'
        );
        
        return finalContent;
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