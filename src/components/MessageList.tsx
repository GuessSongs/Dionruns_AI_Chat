import { Message } from '@/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';

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
              {/* 显示文件 */}
              {message.files && message.files.length > 0 && (
                <div className="mb-2 space-y-2">
                  {message.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {file.type === 'image' ? (
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="max-w-48 max-h-48 rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(file.url, '_blank')}
                        />
                      ) : file.name.includes('.mp4') || file.name.includes('视频') ? (
                        <video 
                          src={file.url}
                          controls
                          className="max-w-64 max-h-48 rounded-lg"
                          poster=""
                        >
                          您的浏览器不支持视频播放
                        </video>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-black/10 rounded">
                          <Paperclip size={16} />
                          <span className="text-sm">{file.name}</span>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 text-xs"
                          >
                            查看
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 显示文本内容 */}
              {message.content && (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
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