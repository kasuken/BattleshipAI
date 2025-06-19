import React, { useState, useEffect } from 'react';
import type { AIConfig } from '../aiService';
import './AISettings.css';

interface AISettingsProps {
  onConfigChange: (config: AIConfig) => void;
  onTestConnection: () => Promise<boolean>;
  isVisible: boolean;
  onClose: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({
  onConfigChange,
  onTestConnection,
  isVisible,
  onClose
}) => {
  const [config, setConfig] = useState<AIConfig>({
    endpoint: 'http://localhost:1234',
    model: 'local-model',
    temperature: 0.7,
    maxTokens: 50
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('battleship-ai-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      onConfigChange(parsed);
    }
  }, [onConfigChange]);

  const handleConfigUpdate = (updates: Partial<AIConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigChange(newConfig);
    
    // Save to localStorage
    localStorage.setItem('battleship-ai-config', JSON.stringify(newConfig));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const success = await onTestConnection();
      setConnectionStatus(success ? 'success' : 'error');
      
      if (success) {
        // Try to fetch available models
        await fetchAvailableModels();
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };
  const fetchAvailableModels = async () => {
    try {
      const response = await fetch(`${config.endpoint}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((model: { id: string }) => model.id) || [];
        setAvailableModels(models);
        console.log('Available models:', models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="ai-settings-overlay">
      <div className="ai-settings-modal">
        <div className="ai-settings-header">
          <h3>🤖 AI Configuration</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="ai-settings-content">
          <div className="setting-group">
            <label htmlFor="endpoint">LM Studio Endpoint:</label>
            <input
              id="endpoint"
              type="text"
              value={config.endpoint}
              onChange={(e) => handleConfigUpdate({ endpoint: e.target.value })}
              placeholder="http://localhost:1234"
            />
            <small>Make sure LM Studio is running and serving on this endpoint</small>
          </div>

          <div className="setting-group">
            <label htmlFor="model">Model:</label>
            {availableModels.length > 0 ? (
              <select
                id="model"
                value={config.model}
                onChange={(e) => handleConfigUpdate({ model: e.target.value })}
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            ) : (
              <input
                id="model"
                type="text"
                value={config.model}
                onChange={(e) => handleConfigUpdate({ model: e.target.value })}
                placeholder="local-model"
              />
            )}
            <small>The model identifier from LM Studio</small>
          </div>

          <div className="setting-group">
            <label htmlFor="temperature">Temperature: {config.temperature}</label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigUpdate({ temperature: parseFloat(e.target.value) })}
            />
            <small>Lower = more focused, Higher = more creative (0.7 recommended)</small>
          </div>

          <div className="setting-group">
            <label htmlFor="maxTokens">Max Tokens:</label>
            <input
              id="maxTokens"
              type="number"
              value={config.maxTokens}
              onChange={(e) => handleConfigUpdate({ maxTokens: parseInt(e.target.value) })}
              min="10"
              max="200"
            />
            <small>Maximum response length (50 recommended for coordinates)</small>
          </div>

          <div className="connection-test">
            <button 
              className="test-button" 
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? '🔄 Testing...' : '🔍 Test Connection'}
            </button>
            
            {connectionStatus === 'success' && (
              <div className="status-message success">
                ✅ Connected successfully!
              </div>
            )}
            
            {connectionStatus === 'error' && (
              <div className="status-message error">
                ❌ Connection failed. Check LM Studio is running.
              </div>
            )}
          </div>

          <div className="setup-instructions">
            <h4>📋 Setup Instructions:</h4>
            <ol>
              <li>Install and launch <strong>LM Studio</strong></li>
              <li>Load a model (recommend a smaller, fast model for real-time play)</li>
              <li>Start the local server (usually on port 1234)</li>
              <li>Test the connection above</li>
              <li>Start playing with AI opponent!</li>
            </ol>
          </div>
        </div>
        
        <div className="ai-settings-footer">
          <button className="save-button" onClick={onClose}>
            💾 Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
