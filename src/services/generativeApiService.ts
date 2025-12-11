// 智谱AI生成模型API服务

// CogView-3-Flash 图像生成API
export const generateImage = async (
  prompt: string,
  apiKey: string,
  quality: 'standard' | 'hd' = 'standard',
  size: string = '1024x1024'
): Promise<string> => {
  try {
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const requestBody = {
      model: 'cogview-3-flash',
      prompt: prompt,
      quality: quality,
      size: size,
    };

    console.log('发送图像生成请求:', {
      model: 'cogview-3-flash',
      promptLength: prompt.length,
      quality,
      size
    });

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('图像生成API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 400) {
        throw new Error('请求参数错误，请检查提示词内容');
      } else if (response.status === 401) {
        throw new Error('API Key无效，请检查您的API Key是否正确');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else {
        throw new Error(`图像生成失败: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('收到图像生成响应:', data);

    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url;
    } else {
      throw new Error('API返回的图像数据异常');
    }

  } catch (error) {
    console.error('图像生成错误:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    }
    throw error;
  }
};

// CogVideoX-Flash 视频生成API
export const generateVideo = async (
  prompt: string,
  apiKey: string,
  imageUrl?: string,
  quality: 'speed' | 'quality' = 'speed',
  withAudio: boolean = false
): Promise<{ taskId: string; status: string }> => {
  try {
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const requestBody: any = {
      model: 'cogvideox-flash',
      quality: quality,
      with_audio: withAudio,
    };

    // 如果有图片URL，使用图片作为基础
    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }
    
    // 如果有提示词，添加提示词
    if (prompt.trim()) {
      requestBody.prompt = prompt.trim();
    }

    // 至少需要提示词或图片之一
    if (!prompt.trim() && !imageUrl) {
      throw new Error('请输入视频描述或上传参考图片');
    }

    console.log('发送视频生成请求:', {
      model: 'cogvideox-flash',
      hasPrompt: !!prompt.trim(),
      hasImage: !!imageUrl,
      quality,
      withAudio
    });

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/videos/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('视频生成API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      if (response.status === 400) {
        throw new Error('请求参数错误，请检查提示词或图片');
      } else if (response.status === 401) {
        throw new Error('API Key无效，请检查您的API Key是否正确');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else {
        throw new Error(`视频生成失败: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('收到视频生成响应:', data);

    if (data.id && data.task_status) {
      return {
        taskId: data.id,
        status: data.task_status
      };
    } else {
      throw new Error('API返回的任务数据异常');
    }

  } catch (error) {
    console.error('视频生成错误:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络连接');
    }
    throw error;
  }
};

// 查询视频生成结果
export const getVideoResult = async (
  taskId: string,
  apiKey: string
): Promise<{ status: string; videoUrl?: string; error?: string }> => {
  try {
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const response = await fetch(`https://open.bigmodel.cn/api/paas/v4/async-result/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`查询失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('视频生成结果:', data);

    return {
      status: data.task_status || 'UNKNOWN',
      videoUrl: data.video_result?.[0]?.url,
      error: data.error?.message
    };

  } catch (error) {
    console.error('查询视频结果错误:', error);
    throw error;
  }
};