import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  inputValue, 
  setInputValue, 
  onSendMessage, 
  isLoading 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // 发送消息
  const handleSend = () => {
    onSendMessage();
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 ${
      isFocused ? 'ring-2 ring-blue-500' : ''
    }`}>
      <div className="flex items-end gap-2 p-2">
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
          <button 
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-label="发送图片"
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
          <span>支持Markdown语法</span>
          <span className="flex items-center gap-1">
            <SendHorizontal size={12} /> Enter 发送
          </span>
        </div>
      </div>
    </div>
  );
};