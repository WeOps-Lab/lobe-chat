'use client';

import { Modal } from 'antd';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BkliteLoginForm from '@/components/BkliteLoginForm';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

interface BkliteLoginModalProps {
  onClose?: () => void;
  open?: boolean;
}

const BkliteLoginModal: React.FC<BkliteLoginModalProps> = ({ 
  open: controlledOpen, 
  onClose 
}) => {
  const { t } = useTranslation('auth');
  const { status } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);
  const oAuthSSOProviders = useUserStore((s) => s.oAuthSSOProviders);

  const hasBkliteProvider = oAuthSSOProviders?.includes('bklite');

  // Auto-popup logic: Automatically pop up when the user is not logged in and the bklite provider is configured
  useEffect(() => {
    if (controlledOpen === undefined && 
        status === 'unauthenticated' && 
        !isLoginWithAuth && 
        hasBkliteProvider && 
        !internalOpen) {
      setInternalOpen(true);
    }
  }, [status, isLoginWithAuth, hasBkliteProvider, controlledOpen, internalOpen]);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  if (!hasBkliteProvider) {
    return null;
  }

  return (
    <Modal
      centered
      footer={null}
      onCancel={handleClose}
      open={isOpen}
      title={t('bklite.title')}
      width={400}
    >
      <div style={{ padding: '20px 0' }}>
        <BkliteLoginForm 
          callbackUrl="/"
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
};

export default BkliteLoginModal;