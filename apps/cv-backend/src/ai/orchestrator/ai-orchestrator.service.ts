import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderType } from '../../common/enums/ai-provider.enum.js';
import {
  IAiProvider,
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderHealth,
  OrchestratorConfig,
  DEFAULT_ORCHESTRATOR_CONFIG,
} from '../providers/ai-provider.interface.js';
import { OpenAiProvider } from '../providers/openai.provider.js';
import { AnthropicProvider } from '../providers/anthropic.provider.js';

interface ProviderState {
  provider: IAiProvider;
  consecutiveFailures: number;
  lastFailureAt: number;
  totalRequests: number;
  totalFailures: number;
  totalLatencyMs: number;
  totalCostMills: number;
}

@Injectable()
export class AiOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private providers = new Map<AiProviderType, ProviderState>();
  private config: OrchestratorConfig;
  private abTestCounter = 0;

  constructor(private configService: ConfigService) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG };
  }

  onModuleInit() {
    this.initializeProviders();
    this.logger.log(
      `AI Orchestrator initialized with providers: ${[...this.providers.keys()].join(', ')}`,
    );
  }

  private initializeProviders() {
    // ── OpenAI ──
    const openaiKey = this.configService.get<string>('openai.apiKey');
    if (openaiKey) {
      const provider = new OpenAiProvider(openaiKey, 'gpt-5');
      this.providers.set(AiProviderType.OPENAI, {
        provider,
        consecutiveFailures: 0,
        lastFailureAt: 0,
        totalRequests: 0,
        totalFailures: 0,
        totalLatencyMs: 0,
        totalCostMills: 0,
      });
      this.logger.log('✅ OpenAI provider registered');
    }

    // ── Anthropic ──
    const anthropicKey = this.configService.get<string>('anthropic.apiKey');
    if (anthropicKey) {
      const provider = new AnthropicProvider(
        anthropicKey,
        'claude-sonnet-4-20250514',
      );
      this.providers.set(AiProviderType.ANTHROPIC, {
        provider,
        consecutiveFailures: 0,
        lastFailureAt: 0,
        totalRequests: 0,
        totalFailures: 0,
        totalLatencyMs: 0,
        totalCostMills: 0,
      });
      this.logger.log('✅ Anthropic provider registered');
    }

    if (this.providers.size === 0) {
      this.logger.warn(
        '⚠️ No AI providers configured! Set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
      );
    }
  }

  // ─── Main Completion Entry Point ───

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const selectedProvider = this.selectProvider(request);
    const fallbackProvider = this.getFallbackProvider(selectedProvider);

    try {
      const result = await this.executeWithProvider(selectedProvider, request);
      return result;
    } catch (primaryError: any) {
      this.logger.warn(
        `Primary provider ${selectedProvider} failed: ${primaryError.message}`,
      );

      if (fallbackProvider) {
        this.logger.log(`Falling back to ${fallbackProvider}`);
        try {
          const result = await this.executeWithProvider(
            fallbackProvider,
            request,
          );
          return result;
        } catch (fallbackError: any) {
          this.logger.error(
            `Fallback provider ${fallbackProvider} also failed: ${fallbackError.message}`,
          );
          throw new Error(
            `All AI providers failed. Primary (${selectedProvider}): ${primaryError.message}. ` +
              `Fallback (${fallbackProvider}): ${fallbackError.message}`,
          );
        }
      }

      throw primaryError;
    }
  }

  // ─── Provider Selection Logic ───

  private selectProvider(request: AiCompletionRequest): AiProviderType {
    // If A/B testing is enabled, split traffic
    if (this.config.abTestingEnabled && this.providers.size >= 2) {
      this.abTestCounter++;
      const useAlternate =
        (this.abTestCounter % 100) / 100 > this.config.abTestSplitRatio;
      if (useAlternate && this.config.fallbackProvider) {
        const fallbackState = this.providers.get(this.config.fallbackProvider);
        if (
          fallbackState &&
          this.isProviderHealthy(this.config.fallbackProvider)
        ) {
          return this.config.fallbackProvider;
        }
      }
    }

    // Cost optimization: route to cheaper provider if quality requirements allow
    if (
      this.config.costOptimizationEnabled &&
      request.maxTokens &&
      request.maxTokens <= 2000
    ) {
      const anthropicState = this.providers.get(AiProviderType.ANTHROPIC);
      if (anthropicState && this.isProviderHealthy(AiProviderType.ANTHROPIC)) {
        return AiProviderType.ANTHROPIC;
      }
    }

    // Default: use primary if healthy, otherwise fallback
    if (this.isProviderHealthy(this.config.primaryProvider)) {
      return this.config.primaryProvider;
    }

    if (
      this.config.fallbackProvider &&
      this.isProviderHealthy(this.config.fallbackProvider)
    ) {
      this.logger.warn(
        `Primary provider ${this.config.primaryProvider} unhealthy, using fallback ${this.config.fallbackProvider}`,
      );
      return this.config.fallbackProvider;
    }

    // All providers degraded — try primary anyway
    return this.config.primaryProvider;
  }

  private getFallbackProvider(primary: AiProviderType): AiProviderType | null {
    for (const [type] of this.providers) {
      if (type !== primary) return type;
    }
    return null;
  }

  private isProviderHealthy(type: AiProviderType): boolean {
    const state = this.providers.get(type);
    if (!state) return false;

    // Check consecutive failure threshold
    if (state.consecutiveFailures >= this.config.failoverThreshold) {
      // Check if cooldown period has passed
      const timeSinceFailure = Date.now() - state.lastFailureAt;
      if (timeSinceFailure < this.config.failoverCooldownMs) {
        return false;
      }
      // Cooldown passed — allow retry and reset
      state.consecutiveFailures = 0;
    }

    return true;
  }

  // ─── Execution ───

  private async executeWithProvider(
    type: AiProviderType,
    request: AiCompletionRequest,
  ): Promise<AiCompletionResponse> {
    const state = this.providers.get(type);
    if (!state) {
      throw new Error(`AI provider ${type} is not configured`);
    }

    state.totalRequests++;

    try {
      const result = await state.provider.complete(request);

      // Success: reset failure counter
      state.consecutiveFailures = 0;
      state.totalLatencyMs += result.latencyMs;
      state.totalCostMills += result.estimatedCostMills;

      this.logger.debug(
        `[${type}] Completed in ${result.latencyMs}ms, ` +
          `tokens: ${result.usage.totalTokens}, cost: ${result.estimatedCostMills}mills, ` +
          `finish: ${result.finishReason}`,
      );

      return result;
    } catch (error: any) {
      state.consecutiveFailures++;
      state.totalFailures++;
      state.lastFailureAt = Date.now();

      this.logger.error(
        `[${type}] Failed (${state.consecutiveFailures} consecutive): ${error.message}`,
      );

      throw error;
    }
  }

  // ─── Health & Metrics ───

  async getHealthStatus(): Promise<{
    providers: AiProviderHealth[];
    activeProvider: AiProviderType;
    config: OrchestratorConfig;
  }> {
    const healthChecks: AiProviderHealth[] = [];

    for (const [type, state] of this.providers) {
      try {
        const health = await state.provider.healthCheck();
        health.errorRate =
          state.totalRequests > 0
            ? state.totalFailures / state.totalRequests
            : 0;
        health.consecutiveFailures = state.consecutiveFailures;
        healthChecks.push(health);
      } catch {
        healthChecks.push({
          provider: type,
          healthy: false,
          latencyMs: -1,
          lastChecked: new Date(),
          errorRate: 1,
          consecutiveFailures: state.consecutiveFailures,
        });
      }
    }

    return {
      providers: healthChecks,
      activeProvider: this.config.primaryProvider,
      config: this.config,
    };
  }

  getMetrics(): Record<
    string,
    {
      totalRequests: number;
      totalFailures: number;
      avgLatencyMs: number;
      totalCostMills: number;
      errorRate: number;
    }
  > {
    const metrics: Record<string, any> = {};

    for (const [type, state] of this.providers) {
      metrics[type] = {
        totalRequests: state.totalRequests,
        totalFailures: state.totalFailures,
        avgLatencyMs:
          state.totalRequests > 0
            ? Math.round(state.totalLatencyMs / state.totalRequests)
            : 0,
        totalCostMills: state.totalCostMills,
        errorRate:
          state.totalRequests > 0
            ? Math.round((state.totalFailures / state.totalRequests) * 10000) /
              100
            : 0,
      };
    }

    return metrics;
  }

  // ─── Runtime Configuration ───

  updateConfig(partial: Partial<OrchestratorConfig>) {
    this.config = { ...this.config, ...partial };
    this.logger.log(`Orchestrator config updated: ${JSON.stringify(partial)}`);
  }

  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  getAvailableProviders(): AiProviderType[] {
    return [...this.providers.keys()];
  }
}
