import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from '../../auth/api-key.service.js';
import { ApiKeyScope } from '../enums/api-key-scope.enum.js';

export const API_KEY_SCOPES = 'api_key_scopes';

/**
 * Guard that validates API key authentication.
 * Supports both Bearer token (JWT) and API key (X-API-Key header) authentication.
 * When both are present, JWT takes priority.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private apiKeyService: ApiKeyService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    // If no API key header, skip (allow JWT auth to handle it)
    if (!apiKeyHeader) {
      return true;
    }

    const result = await this.apiKeyService.validateKey(apiKeyHeader);
    if (!result.valid || !result.apiKey) {
      throw new UnauthorizedException(result.reason || 'Invalid API key');
    }

    // Check required scopes
    const requiredScopes = this.reflector.get<ApiKeyScope[]>(
      API_KEY_SCOPES,
      context.getHandler(),
    );

    if (requiredScopes?.length) {
      const hasAllScopes = requiredScopes.every((scope) =>
        this.apiKeyService.hasScope(result.apiKey!, scope),
      );
      if (!hasAllScopes) {
        throw new UnauthorizedException(
          `API key missing required scopes: ${requiredScopes.join(', ')}`,
        );
      }
    }

    // Check IP whitelist
    const clientIp = request.ip || request.connection?.remoteAddress;
    if (!this.apiKeyService.isIpAllowed(result.apiKey, clientIp)) {
      throw new UnauthorizedException('Request from unauthorized IP address');
    }

    // Attach API key context to request
    request.apiKey = result.apiKey;
    request.user = {
      _id: result.apiKey.userId,
      organizationId: result.apiKey.organizationId,
      isApiKey: true,
    };

    return true;
  }
}
