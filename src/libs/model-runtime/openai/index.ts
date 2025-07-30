import OpenAI from 'openai';

import { responsesAPIModels } from '@/const/models';

import { ChatStreamPayload, ModelProvider } from '../types';
import { processMultiProviderModelList } from '../utils/modelParse';
import { createOpenAICompatibleRuntime } from '../utils/openaiCompatibleFactory';
import { pruneReasoningPayload } from '../utils/openaiHelpers';

export interface OpenAIModelCard {
  id: string;
}

const prunePrefixes = ['o1', 'o3', 'o4', 'codex', 'computer-use'];
const oaiSearchContextSize = process.env.OPENAI_SEARCH_CONTEXT_SIZE; // low, medium, high

export const LobeOpenAI = createOpenAICompatibleRuntime<{
  bkliteToken?: string;
}>({
  baseURL: 'https://api.openai.com/v1',
  chatCompletion: {
    handlePayload: (payload) => {
      const { enabledSearch, model, ...rest } = payload;

      const baseParams = {
        ...rest,
        model: 'WeOps小助手',
        ...(process.env.BK_LITE_APP_ID && { studio_id: process.env.BK_LITE_APP_ID }),
      };

      if (responsesAPIModels.has(model) || enabledSearch) {
        return { ...baseParams, apiMode: 'responses', enabledSearch } as ChatStreamPayload;
      }

      if (prunePrefixes.some((prefix) => model.startsWith(prefix))) {
        return pruneReasoningPayload({ ...baseParams, ...payload }) as any;
      }

      if (model.includes('-search-')) {
        return {
          ...baseParams,
          frequency_penalty: undefined,
          presence_penalty: undefined,
          stream: payload.stream ?? true,
          temperature: undefined,
          top_p: undefined,
          ...(oaiSearchContextSize && {
            web_search_options: {
              search_context_size: oaiSearchContextSize,
            },
          }),
        } as any;
      }

      return { ...baseParams, stream: payload.stream ?? true };
    },
  },
  // remove the logic for obtaining the token from environment variables
  constructorOptions: {
    defaultHeaders: {},
  },
  customClient: {
    createClient: (options) => {
      const defaultHeaders = options.bkliteToken 
        ? { 'Authorization': `Bearer ${options.bkliteToken}` }
        : {};

      return new OpenAI({
        ...options,
        defaultHeaders: {
          ...options.defaultHeaders,
          ...defaultHeaders,
        },
      });
    },
  },
  debug: {
    chatCompletion: () => process.env.DEBUG_OPENAI_CHAT_COMPLETION === '1',
    responses: () => process.env.DEBUG_OPENAI_RESPONSES === '1',
  },
  models: async ({ client }) => {
    const modelsPage = (await client.models.list()) as any;
    const modelList: OpenAIModelCard[] = modelsPage.data;

    // 自动检测模型提供商并选择相应配置
    return processMultiProviderModelList(modelList);
  },
  provider: ModelProvider.OpenAI,
  responses: {
    handlePayload: (payload) => {
      const { enabledSearch, model, tools, ...rest } = payload;

      const openaiTools = enabledSearch
        ? [
            ...(tools || []),
            {
              type: 'web_search_preview',
              ...(oaiSearchContextSize && {
                search_context_size: oaiSearchContextSize,
              }),
            },
          ]
        : tools;

      if (prunePrefixes.some((prefix) => model.startsWith(prefix))) {
        return pruneReasoningPayload({
          ...rest,
          model,
          reasoning: payload.reasoning
            ? { ...payload.reasoning, summary: 'auto' }
            : { summary: 'auto' },
          stream: payload.stream ?? true,
          tools: openaiTools as any,
          // computer-use series must set truncation as auto
          ...(model.startsWith('computer-use') && { truncation: 'auto' }),
        }) as any;
      }

      return { ...rest, model, stream: payload.stream ?? true, tools: openaiTools } as any;
    },
  },
});
