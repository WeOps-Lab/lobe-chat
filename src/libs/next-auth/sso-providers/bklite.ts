import Credentials from 'next-auth/providers/credentials';

interface BkliteUser {
  email?: string;
  id: string;
  name?: string;
  token?: string;
  username: string;
}

interface BkliteLoginResponse {
  data?: BkliteUser;
  message?: string;
  result: boolean;
}

// Credentials provider for bklite
const provider = {
  id: 'bklite',
  provider: Credentials({
    authorize: async (credentials) => {
      try {
        if (!credentials?.username || !credentials?.password) {
          console.error('BkLite: Missing username or password');
          return null;
        }

        const loginApiUrl = process.env.AUTH_BKLITE_API_URL;
        if (!loginApiUrl) {
          console.error('BkLite: AUTH_BKLITE_API_URL environment variable is not set');
          return null;
        }

        const response = await fetch(loginApiUrl, {
          body: JSON.stringify({
            domain: 'domain.com',
            password: credentials.password,
            username: credentials.username,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        console.log('BkLite login request:', response);
        const responseData: BkliteLoginResponse = await response.json();
        console.log('BkLite login response:', responseData);    
        if (!responseData.result) {
          console.error('BkLite login failed:', responseData.message || 'Unknown error');
          return null;
        }

        if (!responseData.data) {
          console.error('BkLite: No user data returned');
          return null;
        }

        const user = responseData.data;
        
        return {
          email: user.email || null,
          id: user.id || user.username,
          name: user.name || user.username,
          token: user.token
        };

      } catch (error) {
        console.error('BkLite authorization error:', error);
        return null;
      }
    },
    credentials: {
      password: { 
        label: '密码', 
        placeholder: '请输入密码',
        type: 'password'
      },
      username: { 
        label: '用户名', 
        placeholder: '请输入用户名',
        type: 'text'
      }
    },
    id: 'bklite',
    name: 'BkLite'
  })
};

export default provider;