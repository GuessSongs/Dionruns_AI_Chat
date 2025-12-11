import { useState } from 'react';
import { X, Download, FileText, Calendar, MessageSquare, Check } from 'lucide-react';
import { Conversation } from '@/types';
import { exportConversations, exportAllConversations } from '@/services/storageService';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportModalProps {
  conversations: Conversation[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ conversations, onClose }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map(conv => conv.id)));
    }
  };

  // 切换单个对话选择状态
  const toggleConversation = (conversationId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedIds(newSelected);
  };

  // 导出选中的对话
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      toast.error('请至少选择一个对话');
      return;
    }

    setIsExporting(true);
    try {
      exportConversations(Array.from(selectedIds));
      toast.success(`成功导出 ${selectedIds.size} 个对话`);
      onClose();
    } catch (error) {
      toast.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 导出全部对话
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      exportAllConversations();
      toast.success(`成功导出全部 ${conversations.length} 个对话`);
      onClose();
    } catch (error) {
      toast.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const isAllSelected = selectedIds.size === conversations.length && conversations.length > 0;
  const isPartialSelected = selectedIds.size > 0 && selectedIds.size < conversations.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="text-blue-500" size={24} />
            <div>
              <h2 className="text-xl font-bold">导出对话</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                选择要导出的对话，将保存为JSON格式文件
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            disabled={isExporting}
          >
            <X size={20} />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MessageSquare size={16} />
                总计 {conversations.length} 个对话
              </span>
              <span className="flex items-center gap-1">
                <Check size={16} />
                已选择 {selectedIds.size} 个
              </span>
            </div>
            
            {/* 全选按钮 */}
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              disabled={isExporting}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartialSelected;
                }}
                onChange={() => {}}
                className="rounded"
              />
              {isAllSelected ? '取消全选' : '全选'}
            </button>
          </div>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p>暂无对话记录</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedIds.has(conversation.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => toggleConversation(conversation.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(conversation.id)}
                    onChange={() => {}}
                    className="rounded text-blue-600 focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} className="text-gray-400 flex-shrink-0" />
                      <h3 className="font-medium truncate">{conversation.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {conversation.messages.length} 条消息
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatTime(conversation.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>导出格式：JSON</p>
              <p>包含：对话内容、时间戳、文件信息</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isExporting}
              >
                取消
              </button>
              
              <button
                onClick={handleExportAll}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isExporting || conversations.length === 0}
              >
                {isExporting ? '导出中...' : '导出全部'}
              </button>
              
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isExporting || selectedIds.size === 0}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    导出选中 ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};