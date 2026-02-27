import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  AiProviderType,
  AiModelTier,
} from '../../common/enums/ai-provider.enum.js';
import {
  IAiProvider,
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderHealth,
  AiModelConfig,
} from './ai-provider.interface.js';

export class OpenAiProvider implements IAiProvider {
  readonly type = AiProviderType.OPENAI;
  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI;
  private defaultModel: string;
  private lastHealthCheck: AiProviderHealth | null = null;

  private static readonly MODELS: AiModelConfig[] = [
    {
      name: 'gpt-5',
      tier: AiModelTier.PREMIUM,
      maxTokens: 32768,
      costPerInputToken: 0.000005,
      costPerOutputToken: 0.000015,
      supportsJsonMode: true,
      supportsTemperature: false,
    },
    {
      name: 'gpt-4.1',
      tier: AiModelTier.STANDARD,
      maxTokens: 32768,
      costPerInputToken: 0.000002,
      costPerOutputToken: 0.000008,
      supportsJsonMode: true,
      supportsTemperature: true,
    },
    {
      name: 'gpt-4.1-mini',
      tier: AiModelTier.ECONOMY,
      maxTokens: 16384,
      costPerInputToken: 0.0000004,
      costPerOutputToken: 0.0000016,
      supportsJsonMode: true,
      supportsTemperature: true,
    },
    {
      name: 'gpt-4.1-nano',
      tier: AiModelTier.ECONOMY,
      maxTokens: 8192,
      costPerInputToken: 0.0000001,
      costPerOutputToken: 0.0000004,
      supportsJsonMode: true,
      supportsTemperature: true,
    },
  ];

  constructor(apiKey: string, defaultModel = 'gpt-5') {
    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const model = request.model || this.defaultModel;
    const modelConfig = this.getModelConfig(model);
    const startTime = Date.now();

    try {
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        max_completion_tokens:
          request.maxTokens || modelConfig?.maxTokens || 16384,
      };

      if (request.jsonMode) {
        params.response_format = { type: 'json_object' };
      }

      const completion = await this.client.chat.completions.create(params);
      const latencyMs = Date.now() - startTime;
      const usage = completion.usage;

      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;

      return {
        content: completion.choices[0]?.message?.content || '',
        provider: this.type,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: usage?.total_tokens || promptTokens + completionTokens,
        },
        finishReason: completion.choices[0]?.finish_reason || 'unknown',
        latencyMs,
        estimatedCostMills: this.estimateCost(
          promptTokens,
          completionTokens,
          model,
        ),
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      this.logger.error(
        `OpenAI completion failed [${model}] after ${latencyMs}ms: ${error.message}`,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<AiProviderHealth> {
    const startTime = Date.now();
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: 'ping' }],
        max_completion_tokens: 5,
      });

      this.lastHealthCheck = {
        provider: this.type,
        healthy: true,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
        errorRate: 0,
        consecutiveFailures: 0,
      };
    } catch {
      this.lastHealthCheck = {
        provider: this.type,
        healthy: false,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
        errorRate: 1,
        consecutiveFailures:
          (this.lastHealthCheck?.consecutiveFailures || 0) + 1,
      };
    }

    return this.lastHealthCheck;
  }

  getModels(): AiModelConfig[] {
    return OpenAiProvider.MODELS;
  }

  estimateCost(
    inputTokens: number,
    outputTokens: number,
    model?: string,
  ): number {
    const cfg = this.getModelConfig(model || this.defaultModel);
    if (!cfg) return 0;
    const inputCost = inputTokens * cfg.costPerInputToken;
    const outputCost = outputTokens * cfg.costPerOutputToken;
    return Math.round((inputCost + outputCost) * 1000);
  }

  private getModelConfig(model: string): AiModelConfig | undefined {
    return OpenAiProvider.MODELS.find((m) => m.name === model);
  }
}
