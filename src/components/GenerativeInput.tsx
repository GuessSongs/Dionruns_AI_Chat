import { useState, useRef } from 'react';
import { Image, Video, Wand2, Upload, X } from 'lucide-react';

interface GenerativeInputProps {
  model: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  onGenerate: (prompt: string, options?: any) => void;
  isLoading: boolean;
}

export const GenerativeInput: React.FC<GenerativeInputProps> = ({
  model,
  inputValue,
  setInputValue,
  onGenerate,
  isLoading
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<'standard' | 'hd' | 'speed' | 'quality'>('standard');
  const [size, setSize] = useState('1024x1024');
  const [withAudio, setWithAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageModel = model === 'cogview-3-flash';
  const isVideoModel = model === 'cogvideox-flash';

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  // 移除图片
  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  // 处理拖拽
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 生成内容
  const handleGenerate = () => {
    if (isImageModel) {
      if (!inputValue.trim()) {
        alert('请输入图片描述');
        return;
      }
      onGenerate(inputValue.trim(), { quality, size });
    } else if (isVideoModel) {
      if (!inputValue.trim() && !imageFile) {
        alert('请输入视频描述或上传参考图片');
        return;
      }
      onGenerate(inputValue.trim(), { 
        imageFile, 
        quality: quality as 'speed' | 'quality', 
        withAudio 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 图片上传区域（仅视频模型显示） */}
      {isVideoModel && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            参考图片（可选）
          </label>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="参考图片"
                  className="max-w-40 max-h-40 rounded-lg object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-16 w-16 text-gray-400 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  拖拽图片到此处或
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-500 hover:text-blue-600 ml-1 underline"
                  >
                    点击上传
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最大 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {/* 提示词输入 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {isImageModel ? '图片描述' : '视频描述'}
          {isVideoModel && imageFile ? (
            <span className="text-gray-500 font-normal"> (可选)</span>
          ) : (
            <span className="text-red-500 font-normal"> *</span>
          )}
        </label>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isImageModel 
              ? '详细描述你想要生成的图片，例如：一只橘色的小猫坐在绿色的草地上，阳光明媚，卡通风格'
              : '详细描述你想要生成的视频内容，例如：一只小鸟在蓝天白云中自由飞翔，慢镜头，唯美风格'
          }
          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none text-sm"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 提示：描述越详细具体，生成效果越好
        </p>
      </div>

      {/* 参数设置 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
          生成参数
        </h4>
        
        <div className="space-y-4">
          {/* 质量设置 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              质量模式
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              {isImageModel ? (
                <>
                  <option value="standard">标准质量 - 快速生成</option>
                  <option value="hd">高清质量 - 精细效果</option>
                </>
              ) : (
                <>
                  <option value="speed">速度优先 - 快速生成</option>
                  <option value="quality">质量优先 - 最佳效果</option>
                </>
              )}
            </select>
          </div>

          {/* 尺寸设置（仅图片模型） */}
          {isImageModel && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                图片尺寸
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              >
                <option value="1024x1024">1024×1024 (正方形)</option>
                <option value="768x1344">768×1344 (竖屏 9:16)</option>
                <option value="1344x768">1344×768 (横屏 16:9)</option>
                <option value="864x1152">864×1152 (竖屏 3:4)</option>
                <option value="1152x864">1152×864 (横屏 4:3)</option>
                <option value="1440x720">1440×720 (超宽屏)</option>
                <option value="720x1440">720×1440 (超长屏)</option>
              </select>
            </div>
          )}

          {/* 音频设置（仅视频模型） */}
          {isVideoModel && (
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={withAudio}
                  onChange={(e) => setWithAudio(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  disabled={isLoading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    生成AI音效
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    为视频添加匹配的背景音效
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={handleGenerate}
          disabled={isLoading || (!inputValue.trim() && (!isVideoModel || !imageFile))}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-3 text-lg ${
            isLoading || (!inputValue.trim() && (!isVideoModel || !imageFile))
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              {isImageModel ? <Image size={24} /> : <Video size={24} />}
              {isImageModel ? '🎨 生成图片' : '🎬 生成视频'}
            </>
          )}
        </button>

        {/* 提示信息 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <p className="font-medium">💡 生成提示：</p>
            <p>• {isImageModel ? '图片生成通常需要5-20秒' : '视频生成可能需要几分钟时间'}</p>
            <p>• 描述越详细具体，生成效果越好</p>
            <p>• 请避免包含敏感或不当内容</p>
            {isVideoModel && <p>• 视频生成为异步任务，请耐心等待</p>}
          </div>
        </div>
      </div>
    </div>
  );
};