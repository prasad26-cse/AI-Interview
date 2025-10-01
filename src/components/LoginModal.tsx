import React, { useState } from 'react';
import { Modal, Form, Input, Button, App } from 'antd';
import { useDispatch } from 'react-redux';
import { login } from '@/store/slices/authSlice';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const ADMIN_EMAIL = 'interviewe@admin.com';
const ADMIN_PASSWORD = 'pass@123';

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onLoginSuccess }) => {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleLogin = (values: { email: string; password: string }) => {
    setLoading(true);
    
    // Simple client-side auth for demo
    if (values.email === ADMIN_EMAIL && values.password === ADMIN_PASSWORD) {
      dispatch(login(values.email));
      message.success('🎉 Login successful! Redirecting to dashboard...');
      onClose();
      
      // Call success callback to redirect to dashboard
      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      }
    } else {
      message.error('❌ Invalid credentials. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 18, fontWeight: 600 }}>
          🔐 Admin Dashboard Login
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      style={{ borderRadius: 16 }}
    >
      <div style={{ 
        padding: '16px 0',
        marginBottom: 16,
        background: '#f0f5ff',
        borderRadius: 8,
        border: '1px solid #adc6ff'
      }}>
        <p style={{ margin: 0, fontSize: 14, color: '#1890ff', textAlign: 'center' }}>
          🔒 Authentication required to access the dashboard
        </p>
      </div>
      
      <Form onFinish={handleLogin} layout="vertical">
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: 'Please enter your email' }]}
        >
          <Input 
            type="email" 
            placeholder="interviewe@admin.com" 
            size="large"
            prefix={<span>📧</span>}
          />
        </Form.Item>
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password 
            placeholder="pass@123" 
            size="large"
            prefix={<span>🔑</span>}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block
            size="large"
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ 
        padding: 12,
        background: '#fff7e6',
        borderRadius: 8,
        border: '1px solid #ffd591',
        marginTop: 16
      }}>
        <p style={{ margin: 0, fontSize: 12, color: '#d46b08' }}>
          💡 <strong>Demo credentials:</strong><br/>
          Email: interviewe@admin.com<br/>
          Password: pass@123
        </p>
      </div>
      
      <p style={{ fontSize: 11, color: '#999', marginTop: 12, textAlign: 'center' }}>
        ℹ️ You'll need to login each time you access the dashboard for security
      </p>
    </Modal>
  );
};
