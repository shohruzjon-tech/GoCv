export enum AiProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export enum AiProviderStatus {
  ACTIVE = 'active',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance',
}

export enum AiModelTier {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PromptVersion {
  V1 = 'v1',
  V2 = 'v2',
  LATEST = 'latest',
}
