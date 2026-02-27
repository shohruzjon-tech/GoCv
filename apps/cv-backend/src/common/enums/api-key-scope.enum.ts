export enum ApiKeyScope {
  CV_READ = 'cv:read',
  CV_WRITE = 'cv:write',
  CV_DELETE = 'cv:delete',
  AI_GENERATE = 'ai:generate',
  AI_TOOLS = 'ai:tools',
  TEMPLATES_READ = 'templates:read',
  USERS_READ = 'users:read',
  USERS_MANAGE = 'users:manage',
  ORG_READ = 'org:read',
  ORG_MANAGE = 'org:manage',
  ANALYTICS_READ = 'analytics:read',
  WEBHOOKS_MANAGE = 'webhooks:manage',
  BILLING_READ = 'billing:read',
  BILLING_MANAGE = 'billing:manage',
  FULL_ACCESS = '*',
}

export enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}
