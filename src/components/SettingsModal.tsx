import { useState, useEffect } from 'react';
import { useQuotaTracker } from '../hooks/useQuotaTracker';

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
  const { getQuotaUsage, getNextResetTime, getAllUsage } = useQuotaTracker();

  const [timeUntilReset, setTimeUntilReset] = useState(getNextResetTime());

  useEffect(() => {
    setInputKeys(apiKeys.length > 0 ? apiKeys : ['']);
  }, [apiKeys]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getNextResetTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [getNextResetTime]);

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

  const formatTime = (h: number, m: number, s: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
              {inputKeys.map((key, index) => {
                const isValid = key.trim() !== '';
                const usage = isValid ? getQuotaUsage(key) : { used: 0, remaining: 10000, percentage: 0 };
                const shortKey = isValid ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : '';
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
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
                    
                    {/* Real-time Quota Bar for each key */}
                    {isValid && (
                      <div className="bg-zinc-900/50 rounded-lg p-2 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="font-mono">{shortKey}</span>
                          <span className={usage.percentage >= 96 ? 'text-red-400' : usage.percentage >= 80 ? 'text-yellow-400' : 'text-green-400'}>
                            {usage.used.toLocaleString()} / 10,000
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              usage.percentage >= 96 ? 'bg-red-500' : usage.percentage >= 80 ? 'bg-yellow-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, usage.percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className={usage.remaining < 400 ? 'text-red-400' : ''}>
                            {usage.remaining.toLocaleString()} remaining
                          </span>
                          <span>{usage.percentage.toFixed(1)}% used</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                📊 API Usage Monitor
                <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-gray-400">Live</span>
              </span>
              <span className="text-lg">{showUsage ? '▲' : '▼'}</span>
            </button>
            
            {showUsage && (
              <div className="px-4 pb-4 space-y-4 text-sm text-gray-300">
                {/* Next Reset Timer */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-orange-400 font-medium">⏱️ Quota Reset Timer</h4>
                      <p className="text-xs text-gray-400 mt-1">Resets at midnight Pacific Time (PT)</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-mono text-white">{formatTime(timeUntilReset.hours, timeUntilReset.minutes, timeUntilReset.seconds)}</span>
                      <p className="text-xs text-gray-400">HH:MM:SS</p>
                    </div>
                  </div>
                </div>

                {/* Quota Info */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-yellow-400 font-medium">📈 YouTube API Quotas</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Free daily quota: <span className="text-white font-medium">10,000 units/day</span></li>
                    <li>• Search endpoint: <span className="text-white">100 units/request</span></li>
                    <li>• Playlist items: <span className="text-white">1 unit/item</span></li>
                    <li>• Switch threshold: <span className="text-red-400">9,600 units (96%)</span></li>
                  </ul>
                </div>

                {/* Key Rotation Info */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-green-400 font-medium">🔄 How Multi-Key Works</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• App monitors quota usage in <span className="text-green-400">real-time</span></li>
                    <li>• Auto-switches key when usage reaches <span className="text-red-400">96%</span></li>
                    <li>• Each key has its own 10,000 unit daily quota</li>
                    <li>• 2 keys = 20,000 | 5 keys = 50,000 daily units</li>
                  </ul>
                </div>

                {/* Cost Warning */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-blue-400 font-medium">💰 Cost Information</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• <span className="text-green-400">FREE</span> up to 10,000 units/day</li>
                    <li>• Over quota: <span className="text-yellow-400">$0.002 per 100 units</span></li>
                    <li>• 100 searches = 10,000 units = <span className="text-yellow-400">$0.20</span></li>
                  </ul>
                </div>

                {/* Tips */}
                <div className="bg-zinc-900/80 rounded-lg p-4 space-y-2">
                  <h4 className="text-purple-400 font-medium">💡 Tips</h4>
                  <ul className="space-y-1 text-gray-400">
                    <li>• Keep 2-3 API keys for reliable service</li>
                    <li>• Quotas reset at midnight PT (UTC-8)</li>
                    <li>• All data stored locally in your browser</li>
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
              {validKeys.length > 1 && `${validKeys.length} API Keys configured (auto-fallback enabled)`}
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
