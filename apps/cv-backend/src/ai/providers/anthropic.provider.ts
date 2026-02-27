import { Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider implements IAiProvider {
  readonly type = AiProviderType.ANTHROPIC;
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic;
  private defaultModel: string;
  private lastHealthCheck: AiProviderHealth | null = null;

  private static readonly MODELS: AiModelConfig[] = [
    {
      name: 'claude-sonnet-4-20250514',
      tier: AiModelTier.PREMIUM,
      maxTokens: 16384,
      costPerInputToken: 0.000003,
      costPerOutputToken: 0.000015,
      supportsJsonMode: false,
      supportsTemperature: true,
    },
    {
      name: 'claude-haiku-4-20250514',
      tier: AiModelTier.STANDARD,
      maxTokens: 8192,
      costPerInputToken: 0.0000008,
      costPerOutputToken: 0.000004,
      supportsJsonMode: false,
      supportsTemperature: true,
    },
  ];

  constructor(apiKey: string, defaultModel = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const model = request.model || this.defaultModel;
    const modelConfig = this.getModelConfig(model);
    const startTime = Date.now();

    try {
      let systemPrompt = request.systemPrompt;
      if (request.jsonMode) {
        systemPrompt +=
          '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, no extra text — just the raw JSON object.';
      }

      const message = await this.client.messages.create({
        model,
        max_tokens: request.maxTokens || modelConfig?.maxTokens || 16384,
        system: systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      });

      const latencyMs = Date.now() - startTime;

      const content =
        message.content[0]?.type === 'text' ? message.content[0].text : '';

      const promptTokens = message.usage.input_tokens;
      const completionTokens = message.usage.output_tokens;

      return {
        content,
        provider: this.type,
        model,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        finishReason: message.stop_reason || 'unknown',
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
        `Anthropic completion failed [${model}] after ${latencyMs}ms: ${error.message}`,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<AiProviderHealth> {
    const startTime = Date.now();
    try {
      await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
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
    return AnthropicProvider.MODELS;
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
    return AnthropicProvider.MODELS.find((m) => m.name === model);
  }
}
