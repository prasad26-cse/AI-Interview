import React from 'react';
import { Row, Col, Space, Divider } from 'antd';
import {
  GithubOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  HeartFilled,
  RocketOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';

interface EnhancedFooterProps {
  onNavigate?: (key: string) => void;
}

export const EnhancedFooter: React.FC<EnhancedFooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (key: string) => {
    if (onNavigate) {
      onNavigate(key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        padding: '60px 48px 24px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Row gutter={[48, 48]}>
          {/* Company Info */}
          <Col xs={24} sm={12} lg={6}>
            <div className="fade-in">
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <RocketOutlined style={{ fontSize: 24, color: '#fff' }} />
              </div>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                AI Interview Assistant
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
                Revolutionizing recruitment with intelligent AI-powered interviews. Fast, fair, and efficient.
              </p>
            </div>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} lg={6}>
            <div className="fade-in">
              <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
                Quick Links
              </h4>
              <Space direction="vertical" size={12}>
                <a 
                  onClick={() => handleLinkClick('interviewee')}
                  style={{ color: '#94a3b8', transition: 'color 0.3s', cursor: 'pointer' }} 
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  Home
                </a>
                <a 
                  onClick={() => handleLinkClick('about')}
                  style={{ color: '#94a3b8', transition: 'color 0.3s', cursor: 'pointer' }} 
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  About Us
                </a>
                <a 
                  onClick={() => handleLinkClick('pricing')}
                  style={{ color: '#94a3b8', transition: 'color 0.3s', cursor: 'pointer' }} 
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  Pricing
                </a>
                <a 
                  onClick={() => handleLinkClick('contact')}
                  style={{ color: '#94a3b8', transition: 'color 0.3s', cursor: 'pointer' }} 
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  Contact
                </a>
              </Space>
            </div>
          </Col>

          {/* Services */}
          <Col xs={24} sm={12} lg={6}>
            <div className="fade-in">
              <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
                Services
              </h4>
              <Space direction="vertical" size={12}>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyOutlined style={{ color: '#667eea' }} />
                  AI Assessment
                </div>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CustomerServiceOutlined style={{ color: '#667eea' }} />
                  24/7 Support
                </div>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RocketOutlined style={{ color: '#667eea' }} />
                  Fast Deployment
                </div>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyOutlined style={{ color: '#667eea' }} />
                  Data Security
                </div>
              </Space>
            </div>
          </Col>

          {/* Contact Info */}
          <Col xs={24} sm={12} lg={6}>
            <div className="fade-in">
              <h4 style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
                Contact Us
              </h4>
              <Space direction="vertical" size={12}>
                <a 
                  href="mailto:prasadkabade677@gmail.com"
                  style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <MailOutlined style={{ color: '#667eea' }} />
                  prasadkabade677@gmail.com
                </a>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined style={{ color: '#667eea' }} />
                  +91 (555) 123-4567
                </div>
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <EnvironmentOutlined style={{ color: '#667eea' }} />
                  Latur, Maharashtra, India
                </div>
              </Space>

              {/* Social Links */}
              <div style={{ marginTop: 24 }}>
                <Space size={16}>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#667eea',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    <GithubOutlined />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#667eea',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    <TwitterOutlined />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#667eea',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      e.currentTarget.style.color = '#667eea';
                    }}
                  >
                    <LinkedinOutlined />
                  </a>
                </Space>
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '40px 0 24px' }} />

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            © {currentYear} AI Interview Assistant. All rights reserved.
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
            Made with <HeartFilled style={{ color: '#ef4444', margin: '0 4px' }} /> by AI Innovation Team
          </p>
        </div>
      </div>
    </footer>
  );
};
