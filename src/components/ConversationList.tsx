import { useState } from 'react';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Conversation } from '@/types';
import { formatTime } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onExportConversations: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onExportConversations,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      onDeleteConversation(conversationId);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">对话列表</h2>
        )}
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <>
              <button
                onClick={onExportConversations}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="导出对话"
                disabled={conversations.length === 0}
              >
                <Download size={20} />
              </button>
              <button
                onClick={onNewConversation}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="新建对话"
              >
                <Plus size={20} />
              </button>
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isCollapsed ? "展开" : "折叠"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // 折叠状态：只显示图标
          <div className="p-2 space-y-2">
            <button
              onClick={onNewConversation}
              className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-center"
              title="新建对话"
            >
              <Plus size={20} />
            </button>
            {conversations.slice(0, 5).map(conversation => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full p-2 rounded-lg transition-colors flex justify-center ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={conversation.title}
              >
                <MessageSquare size={20} />
              </button>
            ))}
          </div>
        ) : (
          // 展开状态：显示完整信息
          <div className="p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>还没有对话</p>
                <p className="text-sm">点击上方的 + 开始新对话</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className="mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{conversation.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {conversation.messages.length} 条消息 • {formatTime(conversation.updatedAt)}
                      </p>
                    </div>
                    {(hoveredId === conversation.id || currentConversationId === conversation.id) && (
                      <button
                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除对话"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};