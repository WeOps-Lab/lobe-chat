'use client';

import { Button, Input } from '@lobehub/ui';
import { Form, message } from 'antd';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

interface BkliteLoginFormProps {
  callbackUrl?: string;
  onCancel?: () => void;
}

interface LoginFormData {
  password: string;
  username: string;
}

const BkliteLoginForm: React.FC<BkliteLoginFormProps> = ({ onCancel, callbackUrl = '/' }) => {
  const { t } = useTranslation('auth');
  const [form] = Form.useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const result = await signIn('bklite', {
        password: values.password,
        redirect: false,
        username: values.username,
      });

      if (result?.ok) {
        message.success(t('bklite.form.loginSuccess'));
        window.location.href = callbackUrl;
      } else {
        message.error(result?.error || t('bklite.form.loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(t('bklite.form.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={16} style={{ maxWidth: 320, width: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ width: '100%' }}
      >
        <Form.Item
          label={t('bklite.form.username.label')}
          name="username"
          rules={[{ message: t('bklite.form.username.required'), required: true }]}
        >
          <Input placeholder={t('bklite.form.username.placeholder')} />
        </Form.Item>

        <Form.Item
          label={t('bklite.form.password.label')}
          name="password"
          rules={[{ message: t('bklite.form.password.required'), required: true }]}
        >
          <Input placeholder={t('bklite.form.password.placeholder')} type="password" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Flexbox gap={8} horizontal>
            {onCancel && (
              <Button onClick={onCancel} style={{ flex: 1 }}>
                {t('bklite.form.cancel')}
              </Button>
            )}
            <Button
              htmlType="submit"
              loading={loading}
              style={{ flex: 1 }}
              type="primary"
            >
              {t('bklite.form.login')}
            </Button>
          </Flexbox>
        </Form.Item>
      </Form>
    </Flexbox>
  );
};

export default BkliteLoginForm;