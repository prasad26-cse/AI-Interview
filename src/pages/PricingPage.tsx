import React from 'react';
import { Card, Row, Col, Button, List } from 'antd';
import { CheckCircleOutlined, RocketOutlined, CrownOutlined, ThunderboltOutlined } from '@ant-design/icons';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      icon: <ThunderboltOutlined />,
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for trying out our platform',
      features: [
        '5 interviews per month',
        'Basic AI assessment',
        'Video recording',
        'Email support',
        'Local storage',
      ],
      color: '#10b981',
      popular: false,
    },
    {
      name: 'Professional',
      icon: <RocketOutlined />,
      price: '$49',
      period: 'per month',
      description: 'Ideal for growing teams',
      features: [
        'Unlimited interviews',
        'Advanced AI grading',
        'Video & audio recording',
        'Priority support',
        'Cloud storage',
        'Custom branding',
        'Analytics dashboard',
      ],
      color: '#667eea',
      popular: true,
    },
    {
      name: 'Enterprise',
      icon: <CrownOutlined />,
      price: 'Custom',
      period: 'Contact us',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom AI training',
        'API access',
        'SSO integration',
        'Advanced analytics',
        'SLA guarantee',
        'White-label solution',
      ],
      color: '#f59e0b',
      popular: false,
    },
  ];

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
            Simple, Transparent Pricing
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 700, margin: '0 auto' }}>
            Choose the perfect plan for your hiring needs. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <Row gutter={[32, 32]}>
          {plans.map((plan, index) => (
            <Col xs={24} md={8} key={index}>
              <Card
                className="slide-up"
                style={{
                  height: '100%',
                  borderRadius: 16,
                  border: plan.popular ? `2px solid ${plan.color}` : 'none',
                  boxShadow: plan.popular
                    ? `0 8px 32px ${plan.color}44`
                    : '0 4px 20px rgba(0,0,0,0.08)',
                  position: 'relative',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                      color: '#fff',
                      padding: '4px 20px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ fontSize: 32, color: '#fff' }}>{plan.icon}</span>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                    {plan.name}
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{plan.description}</p>
                  <div>
                    <span
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: plan.color,
                      }}
                    >
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 14, color: '#64748b', marginLeft: 8 }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <List
                  dataSource={plan.features}
                  renderItem={(feature) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <CheckCircleOutlined style={{ color: plan.color, marginRight: 8 }} />
                      <span style={{ color: '#64748b' }}>{feature}</span>
                    </List.Item>
                  )}
                  style={{ marginBottom: 24 }}
                />

                <Button
                  type={plan.popular ? 'primary' : 'default'}
                  size="large"
                  block
                  style={{
                    height: 48,
                    borderRadius: 10,
                    fontWeight: 600,
                    background: plan.popular
                      ? `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)`
                      : undefined,
                    borderColor: plan.popular ? 'transparent' : plan.color,
                    color: plan.popular ? '#fff' : plan.color,
                  }}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* FAQ Section */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 40 }}>
            Have questions? We're here to help.
          </p>
          <Card
            style={{
              borderRadius: 16,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              textAlign: 'left',
            }}
          >
            <List
              dataSource={[
                {
                  question: 'Can I change plans later?',
                  answer: 'Yes, you can upgrade or downgrade your plan at any time.',
                },
                {
                  question: 'Is there a free trial?',
                  answer: 'Yes, our Starter plan is free forever with basic features.',
                },
                {
                  question: 'What payment methods do you accept?',
                  answer: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise.',
                },
              ]}
              renderItem={(item) => (
                <List.Item style={{ borderBottom: '1px solid #f1f5f9', padding: '20px 0' }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                      {item.question}
                    </h4>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{item.answer}</p>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
