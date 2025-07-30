import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';

import { API_ENDPOINTS } from '@/services/_url';
import BkliteLoginModal from '@/components/BkliteLoginModal';

import UserUpdater from './UserUpdater';

const NextAuth = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider basePath={API_ENDPOINTS.oauth}>
      {children}
      <UserUpdater />
      <BkliteLoginModal />
    </SessionProvider>
  );
};

export default NextAuth;
