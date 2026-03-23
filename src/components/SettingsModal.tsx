import { useState, useEffect } from 'react';

interface SettingsModalProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  onSave,
  onClose,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onSave(inputKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-zinc-900 to-black rounded-xl p-6 max-w-lg w-full border border-zinc-700 shadow-2xl">
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
          <div>
            <label className="text-white text-sm font-medium block mb-2">
              YouTube Data API v3 Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIza..."
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
            inputKey ? 'bg-green-900/30 border border-green-500/30' : 'bg-amber-900/30 border border-amber-500/30'
          }`}>
            <span className="text-xl">{inputKey ? '✅' : '⚠️'}</span>
            <span className={`text-sm ${inputKey ? 'text-green-400' : 'text-amber-400'}`}>
              {inputKey ? 'API Key configured' : 'API Key required to search'}
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
          Your API key is stored locally in your browser and never sent to any server except YouTube.
        </p>
      </div>
    </div>
  );
};
