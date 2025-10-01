import React, { useState } from 'react';
import { Card, Row, Col, Form, Input, Button, message } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

export const ContactPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      message.success('Message sent successfully! We will get back to you soon.');
      form.resetFields();
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fade-in" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
            }}
          >
            Get In Touch
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 700, margin: '0 auto' }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <Row gutter={[48, 48]}>
          {/* Contact Form */}
          <Col xs={24} md={14}>
            <Card
              className="slide-up"
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', marginBottom: 24 }}>
                Send us a Message
              </h2>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="name"
                  label="Your Name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="John Doe"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="john@example.com"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[{ required: true, message: 'Please enter a subject' }]}
                >
                  <Input placeholder="How can we help you?" size="large" />
                </Form.Item>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    style={{ resize: 'none' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    loading={loading}
                    block
                    style={{
                      height: 48,
                      borderRadius: 10,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                    }}
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Contact Information */}
          <Col xs={24} md={10}>
            <div className="slide-up">
              <Card
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  marginBottom: 24,
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', marginBottom: 24 }}>
                  Contact Information
                </h3>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #667eea22 0%, #764ba244 100%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <MailOutlined style={{ fontSize: 24, color: '#667eea' }} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Email
                  </h4>
                  <a
                    href="mailto:prasadkabade677@gmail.com"
                    style={{
                      fontSize: 16,
                      color: '#1e293b',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    prasadkabade677@gmail.com
                  </a>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #10b98122 0%, #05966944 100%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <PhoneOutlined style={{ fontSize: 24, color: '#10b981' }} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Phone
                  </h4>
                  <p style={{ fontSize: 16, color: '#1e293b', fontWeight: 500, margin: 0 }}>
                    +91 (555) 123-4567
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #f59e0b22 0%, #d9770644 100%)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <EnvironmentOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                    Location
                  </h4>
                  <p style={{ fontSize: 16, color: '#1e293b', fontWeight: 500, margin: 0 }}>
                    Latur, Maharashtra, India
                  </p>
                </div>
              </Card>

              <Card
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  Business Hours
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.8 }}>
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </p>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
