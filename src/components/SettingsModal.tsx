import { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Trash2, Edit } from 'lucide-react';
import { ChatSettings, Preset } from '@/types';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>({ ...settings });
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPreset, setNewPreset] = useState<{ name: string; content: string }>({
    name: '',
    content: '',
  });
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // 可用的模型列表
  const availableModels = [
    'GLM-4.1V-Thinking',
    'GLM-4-Flash-250414',
    'GLM-4V-Flash',
    'GLM-Z1-Flash',
    'CogView-3-Flash',
    'CogVideoX-Flash',
  ];

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  // 添加新预设
  const handleAddPreset = () => {
    if (!newPreset.name.trim() || !newPreset.content.trim()) return;
    
    const preset: Preset = {
      id: Date.now().toString(),
      name: newPreset.name.trim(),
      content: newPreset.content.trim(),
    };
    
    setLocalSettings(prev => ({
      ...prev,
      presets: [...prev.presets, preset],
      selectedPreset: preset.id,
    }));
    
    setNewPreset({ name: '', content: '' });
    setIsAddingPreset(false);
  };

  // 删除预设
  const handleDeletePreset = (id: string) => {
    if (localSettings.presets.length <= 1) {
      alert('至少需要保留一个预设');
      return;
    }
    
    const updatedPresets = localSettings.presets.filter(preset => preset.id !== id);
    setLocalSettings(prev => ({
      ...prev,
      presets: updatedPresets,
      selectedPreset: prev.selectedPreset === id ? updatedPresets[0].id : prev.selectedPreset,
    }));
  };

  // 编辑预设
  const handleEditPreset = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setNewPreset({ name: preset.name, content: preset.content });
  };

  // 保存编辑的预设
  const handleSaveEditedPreset = () => {
    if (!editingPresetId || !newPreset.name.trim() || !newPreset.content.trim()) return;
    
    setLocalSettings(prev => ({
      ...prev,
      presets: prev.presets.map(preset =>
        preset.id === editingPresetId
          ? { ...preset, name: newPreset.name.trim(), content: newPreset.content.trim() }
          : preset
      ),
    }));
    
    setNewPreset({ name: '', content: '' });
    setEditingPresetId(null);
  };

  // 保存所有设置
  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto",
          "animate-in fade-in-50 duration-300"
        )}
      >
        {/* 模态框头部 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">设置</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 模态框内容 */}
        <div className="p-6 space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">API Key</label>
            <input
              type="password"
              name="apiKey"
              value={localSettings.apiKey}
              onChange={handleInputChange}
              placeholder="请输入智谱清言API Key"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              您可以在智谱清言官网获取API Key
            </p>
          </div>
          
          {/* 模型选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">模型</label>
            <select
              name="model"
              value={localSettings.model}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          {/* 温度参数 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              温度 ({localSettings.temperature})
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.temperature}
              onChange={handleInputChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              控制生成内容的随机性，值越高越随机，值越低越确定
            </p>
          </div>
          
          {/* 最大 tokens */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">最大回复长度</label>
            <select
              name="maxTokens"
              value={localSettings.maxTokens}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={512}>512 tokens</option>
              <option value={1024}>1024 tokens</option>
              <option value={2048}>2048 tokens</option>
              <option value={4096}>4096 tokens</option>
            </select>
          </div>
          
          {/* 人设预设 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">人设预设</label>
              <button 
                onClick={() => setIsAddingPreset(true)}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <PlusCircle size={16} /> 添加预设
              </button>
            </div>
            
            {isAddingPreset ? (
              <div className="space-y-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                <input
                  type="text"
                  placeholder="预设名称"
                  value={newPreset.name}
                  onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="预设内容"
                  value={newPreset.content}
                  onChange={(e) => setNewPreset({ ...newPreset, content: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setIsAddingPreset(false);
                      setNewPreset({ name: '', content: '' });
                      setEditingPresetId(null);
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    取消
                  </button>
                  <button 
                    onClick={editingPresetId ? handleSaveEditedPreset : handleAddPreset}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {localSettings.presets.map(preset => (
                  <div 
                    key={preset.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all
                      ${localSettings.selectedPreset === preset.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
                    onClick={() => setLocalSettings(prev => ({ ...prev, selectedPreset: preset.id }))}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{preset.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{preset.content}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPreset(preset);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          aria-label="编辑"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                          aria-label="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 模态框底部 */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save size={16} /> 保存设置
          </button>
        </div>
      </div>
    </div>
  );
};