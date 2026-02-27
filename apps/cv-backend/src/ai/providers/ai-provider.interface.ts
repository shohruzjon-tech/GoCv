import {
  AiProviderType,
  AiModelTier,
} from '../../common/enums/ai-provider.enum.js';

// ─── Core Types ───

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  /** Provider-specific model override */
  model?: string;
  /** Metadata for tracking */
  metadata?: {
    userId?: string;
    cvId?: string;
    toolType?: string;
    correlationId?: string;
  };
}

export interface AiCompletionResponse {
  content: string;
  provider: AiProviderType;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
  estimatedCostMills: number;
}

export interface AiProviderHealth {
  provider: AiProviderType;
  healthy: boolean;
  latencyMs: number;
  lastChecked: Date;
  errorRate: number;
  consecutiveFailures: number;
}

export interface AiProviderConfig {
  type: AiProviderType;
  apiKey: string;
  defaultModel: string;
  models: AiModelConfig[];
  maxRetries: number;
  timeoutMs: number;
  priority: number;
  enabled: boolean;
  costMultiplier: number;
}

export interface AiModelConfig {
  name: string;
  tier: AiModelTier;
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  supportsJsonMode: boolean;
  supportsTemperature: boolean;
}

// ─── Provider Interface ───

export interface IAiProvider {
  readonly type: AiProviderType;

  /** Perform a chat completion */
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;

  /** Check provider health */
  healthCheck(): Promise<AiProviderHealth>;

  /** Get available models */
  getModels(): AiModelConfig[];

  /** Estimate cost for a request */
  estimateCost(
    inputTokens: number,
    outputTokens: number,
    model?: string,
  ): number;
}

// ─── Orchestrator Config ───

export interface OrchestratorConfig {
  /** Primary provider */
  primaryProvider: AiProviderType;
  /** Fallback provider when primary fails */
  fallbackProvider?: AiProviderType;
  /** Max consecutive failures before switching to fallback */
  failoverThreshold: number;
  /** Cooldown period (ms) before retrying a failed provider */
  failoverCooldownMs: number;
  /** Enable A/B testing between providers */
  abTestingEnabled: boolean;
  /** A/B test traffic split (0-1, percentage to primary) */
  abTestSplitRatio: number;
  /** Enable cost-based routing */
  costOptimizationEnabled: boolean;
  /** Max cost per request in mills */
  maxCostPerRequestMills: number;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  primaryProvider: AiProviderType.OPENAI,
  fallbackProvider: AiProviderType.ANTHROPIC,
  failoverThreshold: 3,
  failoverCooldownMs: 60_000,
  abTestingEnabled: false,
  abTestSplitRatio: 0.9,
  costOptimizationEnabled: false,
  maxCostPerRequestMills: 500,
};
