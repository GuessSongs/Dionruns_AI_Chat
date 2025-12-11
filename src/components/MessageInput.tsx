import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, SendHorizontal, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'document';
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  inputValue, 
  setInputValue, 
  onSendMessage, 
  isLoading 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // 限制最大高度为120px
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter或Shift+Enter换行
    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
      setInputValue(prev => prev + '\n');
      return;
    }
    
    // Enter发送消息
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newPreviews: FilePreview[] = [];
    
    Array.from(files).forEach(file => {
      // 检查文件类型
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text');
      
      if (isImage || isDocument) {
        const url = URL.createObjectURL(file);
        newPreviews.push({
          file,
          url,
          type: isImage ? 'image' : 'document'
        });
      }
    });
    
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 移除文件预览
  const removeFilePreview = (index: number) => {
    setFilePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  // 发送消息
  const handleSend = () => {
    onSendMessage();
    // 清空文件预览
    filePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    setFilePreviews([]);
  };

  // 清理URL对象
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, []);

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 ${
      isFocused ? 'ring-2 ring-blue-500' : ''
    } ${isDragOver ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
      {/* 文件预览区域 */}
      {filePreviews.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                {preview.type === 'image' ? (
                  <div className="relative">
                    <img 
                      src={preview.url} 
                      alt={preview.file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removeFilePreview(index)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <Paperclip size={16} />
                    <span className="text-sm truncate max-w-20">{preview.file.name}</span>
                    <button
                      onClick={() => removeFilePreview(index)}
                      className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div 
        className="flex items-end gap-2 p-2"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 文本输入区域 */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入消息... (Enter发送，Ctrl+Enter换行)"
          disabled={isLoading}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none outline-none p-2 dark:bg-transparent"
        />
        
        {/* 功能按钮 */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="选择文件"
          >
            <Paperclip size={20} />
          </button>
          
          <button 
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="语音输入"
          >
            <Mic size={20} />
          </button>
          
          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-2 rounded-full transition-all ${
              isLoading 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                : inputValue.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            aria-label="发送消息"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
      
      {/* 底部提示 */}
      <div className="px-3 py-1 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>支持Markdown语法 • 拖拽文件到此处</span>
          <span className="flex items-center gap-1">
            <SendHorizontal size={12} /> Enter 发送
          </span>
        </div>
      </div>
    </div>
  );
};