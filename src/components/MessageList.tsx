import { Message } from '@/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  return (
    <div className="space-y-4">
      {messages.map(message => (
        <div 
          key={message.id} 
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}
        >
          {/* 用户头像 */}
          <div className={`w-8 h-8 rounded-full flex-shrink-0
            ${message.sender === 'user' 
              ? 'bg-blue-500 flex items-center justify-center text-white' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white'}`}
          >
            {message.sender === 'user' ? (
              <i className="fa-solid fa-user"></i>
            ) : (
              <i className="fa-solid fa-robot"></i>
            )}
          </div>
          
          {/* 消息内容 */}
          <div className="max-w-[80%] space-y-1">
            <div 
              className={`px-4 py-3 rounded-xl ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : message.isError
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            
            {/* 时间戳 */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-start gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0" />
          <div className="space-y-1">
            <div className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 max-w-[30%]">
              <div className="flex space-x-2">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full w-2/3" />
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full w-1/3" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};