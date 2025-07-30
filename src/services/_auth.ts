import { JWTPayload, LOBE_CHAT_AUTH_HEADER } from '@/const/auth';
import { isDeprecatedEdition } from '@/const/version';
import { ModelProvider } from '@/libs/model-runtime';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { keyVaultsConfigSelectors, userProfileSelectors } from '@/store/user/selectors';
import {
  AWSBedrockKeyVault,
  AzureOpenAIKeyVault,
  CloudflareKeyVault,
  OpenAICompatibleKeyVault,
} from '@/types/user/settings';
import { createJWT } from '@/utils/jwt';

export const getProviderAuthPayload = (
  provider: string,
  keyVaults: OpenAICompatibleKeyVault &
    AzureOpenAIKeyVault &
    AWSBedrockKeyVault &
    CloudflareKeyVault,
) => {
  switch (provider) {
    case ModelProvider.Bedrock: {
      const { accessKeyId, region, secretAccessKey, sessionToken } = keyVaults;

      const awsSecretAccessKey = secretAccessKey;
      const awsAccessKeyId = accessKeyId;

      const apiKey = (awsSecretAccessKey || '') + (awsAccessKeyId || '');

      return {
        accessKeyId,
        accessKeySecret: awsSecretAccessKey,
        apiKey,
        /** @deprecated */
        awsAccessKeyId,
        /** @deprecated */
        awsRegion: region,
        /** @deprecated */
        awsSecretAccessKey,
        /** @deprecated */
        awsSessionToken: sessionToken,
        region,
        sessionToken,
      };
    }

    case ModelProvider.Azure: {
      return {
        apiKey: keyVaults.apiKey,

        apiVersion: keyVaults.apiVersion,
        /** @deprecated */
        azureApiVersion: keyVaults.apiVersion,
        baseURL: keyVaults.baseURL || keyVaults.endpoint,
      };
    }

    case ModelProvider.Ollama: {
      return { baseURL: keyVaults?.baseURL };
    }

    case ModelProvider.Cloudflare: {
      return {
        apiKey: keyVaults?.apiKey,

        baseURLOrAccountID: keyVaults?.baseURLOrAccountID,
        /** @deprecated */
        cloudflareBaseURLOrAccountID: keyVaults?.baseURLOrAccountID,
      };
    }

    default: {
      return { apiKey: keyVaults?.apiKey, baseURL: keyVaults?.baseURL };
    }
  }
};

// Get the current user's session token (if any)
const getBkliteSessionToken = async (): Promise<string | null> => {
  try {
    // Obtain the next-auth session in the client environment
    if (typeof window !== 'undefined') {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      return session?.accessToken || null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get session token:', error);
    return null;
  }
};

const createAuthTokenWithPayload = async (payload = {}) => {
  const accessCode = keyVaultsConfigSelectors.password(useUserStore.getState());
  const userId = userProfileSelectors.userId(useUserStore.getState());

  // Attempt to obtain the bklite session token
  const bkliteToken = await getBkliteSessionToken();
  
  // If there is a bklite token, add it to the payload
  const enhancedPayload = bkliteToken 
    ? { ...payload, bkliteToken } 
    : payload;

  return createJWT<JWTPayload>({ accessCode, userId, ...enhancedPayload });
};

interface AuthParams {
  // eslint-disable-next-line no-undef
  headers?: HeadersInit;
  payload?: Record<string, any>;
  provider?: string;
}

export const createPayloadWithKeyVaults = (provider: string) => {
  let keyVaults = {};

  // TODO: remove this condition in V2.0
  if (isDeprecatedEdition) {
    keyVaults = keyVaultsConfigSelectors.getVaultByProvider(provider as any)(
      useUserStore.getState(),
    );
  } else {
    keyVaults = aiProviderSelectors.providerKeyVaults(provider)(useAiInfraStore.getState()) || {};
  }

  return getProviderAuthPayload(provider, keyVaults);
};

// eslint-disable-next-line no-undef
export const createHeaderWithAuth = async (params?: AuthParams): Promise<HeadersInit> => {
  let payload = params?.payload || {};

  if (params?.provider) {
    payload = { ...payload, ...createPayloadWithKeyVaults(params?.provider) };
  }

  const token = await createAuthTokenWithPayload(payload);

  // eslint-disable-next-line no-undef
  return { ...params?.headers, [LOBE_CHAT_AUTH_HEADER]: token };
};
