import { useState, useEffect } from 'react';

interface SettingsModalProps {
  apiKeys: string[];
  onSave: (keys: string[]) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKeys,
  onSave,
  onClose,
}) => {
  const [inputKeys, setInputKeys] = useState<string[]>(apiKeys);
  const [showKey, setShowKey] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  useEffect(() => {
    setInputKeys(apiKeys.length > 0 ? apiKeys : ['']);
  }, [apiKeys]);

  const handleAddKey = () => {
    setInputKeys([...inputKeys, '']);
  };

  const handleRemoveKey = (index: number) => {
    if (inputKeys.length > 1) {
      const newKeys = inputKeys.filter((_, i) => i !== index);
      setInputKeys(newKeys);
    }
  };

  const handleKeyChange = (index: number, value: string) => {
    const newKeys = [...inputKeys];
    newKeys[index] = value;
    setInputKeys(newKeys);
  };

  const handleSave = () => {
    const filteredKeys = inputKeys.filter(k => k.trim() !== '');
    onSave(filteredKeys);
    onClose();
  };

  const validKeys = inputKeys.filter(k => k.trim() !== '');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-zinc-900 to-black rounded-xl p-6 max-w-2xl w-full border border-zinc-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-2xl">⚙️</span> Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {/* API Keys Section */}
          <div>
            <label className="text-white text-sm font-medium block mb-2">
              YouTube Data API v3 Keys
              <span className="text-gray-400 text-xs ml-2">(Add multiple for automatic fallback)</span>
            </label>
            
            <div className="space-y-3">
              {inputKeys.map((key, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                      placeholder={index === 0 ? "AIza..." : "Backup API Key (optional)"}
                      className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {inputKeys.length > 1 && (
                    <button
                      onClick={() => handleRemoveKey(index)}
                      className="px-3 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-lg transition-colors"
                      title="Remove this key"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleAddKey}
              className="mt-3 w-full py-2 border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-lg text-gray-400 hover:text-orange-400 transition-colors text-sm"
            >
              + Add Another API Key
            </button>
          </div>

          {/* Collapsible Usage Details */}
          <div className="bg-black/60 rounded-lg border border-zinc-800">
            <button
              onClick={() => setShowUsage(!showUsage)}
              className="w-full p-4 flex items-center justify-between text-orange-400 hover:text-orange-300 transition-colors"
            >
              <span className="font-medium flex items-center gap-2">
                📊 API Usage Information
              </span>
              <span className="text-lg">{showUsage ? '▲' : '▼'}</span>
            </button>
            
            {showUsage && (
              <div className="px-4 pb-4 space-y-4 text-sm text-gray-300">
                {/* Quota Info */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-yellow-400 font-medium">📈 YouTube API Quotas</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Free quota: <span className="text-white">10,000 units/day</span></li>
                    <li>• Search endpoint: <span className="text-white">100 units/request</span></li>
                    <li>• Playlist items: <span className="text-white">1 unit/request</span></li>
                    <li>• Each search uses ~100 units (100 results = 10,000/day limit)</li>
                  </ul>
                </div>

                {/* Key Rotation Info */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-green-400 font-medium">🔄 Multiple Keys (Recommended)</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Add multiple API keys to avoid hitting quota limits</li>
                    <li>• When one key exceeds quota, app auto-switches to next</li>
                    <li>• Each key has its own 10,000 unit daily quota</li>
                    <li>• <span className="text-white">2 keys = 20,000 daily searches</span></li>
                    <li>• <span className="text-white">5 keys = 50,000 daily searches</span></li>
                  </ul>
                </div>

                {/* Cost Warning */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-blue-400 font-medium">💰 Cost Information</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Google gives <span className="text-green-400">free 10,000 units/day</span></li>
                    <li>• Exceeding quota: <span className="text-yellow-400">$0.002 per 100 units</span></li>
                    <li>• Staying under 10K units: <span className="text-green-400">Always FREE</span></li>
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-purple-400 font-medium">💡 Tips</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Keep 2-3 API keys for reliable service</li>
                    <li>• Monitor usage at: console.cloud.google.com</li>
                    <li>• Quotas reset at midnight Pacific time</li>
                    <li>• Keys are stored locally and never sent to third parties</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-black/60 rounded-lg p-4 border border-zinc-800">
            <h3 className="text-orange-400 font-medium mb-2">📝 How to get your API Key:</h3>
            <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">console.cloud.google.com</a></li>
              <li>Create a new project (or select existing)</li>
              <li>Enable the <span className="text-orange-400">YouTube Data API v3</span></li>
              <li>Go to Credentials → Create Credentials → API Key</li>
              <li>Copy and paste the key here</li>
            </ol>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            validKeys.length > 0 ? 'bg-green-900/30 border border-green-500/30' : 'bg-amber-900/30 border border-amber-500/30'
          }`}>
            <span className="text-xl">{validKeys.length > 0 ? '✅' : '⚠️'}</span>
            <span className={`text-sm ${validKeys.length > 0 ? 'text-green-400' : 'text-amber-400'}`}>
              {validKeys.length === 0 && 'API Key required to search'}
              {validKeys.length === 1 && '1 API Key configured'}
              {validKeys.length > 1 && `${validKeys.length} API Keys configured (fallback enabled)`}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white font-medium py-3 rounded-lg transition-all"
          >
            💾 Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>

        {/* Info Footer */}
        <p className="text-gray-500 text-xs mt-4 text-center">
          Your API keys are stored locally in your browser and never sent to any server except YouTube.
        </p>
      </div>
    </div>
  );
};
