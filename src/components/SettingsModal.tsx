import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, App } from 'antd';
import { getApiKey, saveApiKey } from '@/utils/storage';
import { initializeHuggingFace } from '@/services/huggingfaceService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { message } = App.useApp();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadApiKey();
    }
  }, [visible]);

  const loadApiKey = async () => {
    const key = await getApiKey();
    if (key) {
      setApiKey(key);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      message.error('Please enter a valid API key');
      return;
    }

    setLoading(true);
    try {
      await saveApiKey(apiKey);
      initializeHuggingFace(apiKey);
      message.success('API key saved successfully');
      onClose();
    } catch (error) {
      message.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Settings"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          Save
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 8 }}>
          <strong>Hugging Face API Key</strong>
        </p>
        <Input.Password
          placeholder="Enter your Hugging Face API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          Get your free API token at <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">Hugging Face</a>. Your key is stored locally and only sent to Hugging Face's API.
        </p>
      </div>
    </Modal>
  );
};
