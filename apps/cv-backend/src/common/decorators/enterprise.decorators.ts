import { SetMetadata } from '@nestjs/common';
import { ApiKeyScope } from '../enums/api-key-scope.enum.js';
import { OrgRole } from '../enums/org-role.enum.js';
import { API_KEY_SCOPES } from '../guards/api-key.guard.js';
import { ORG_ROLES_KEY, ORG_PARAM_KEY } from '../guards/org-role.guard.js';

/**
 * Decorator to specify required API key scopes for an endpoint.
 * @example @RequireScopes(ApiKeyScope.CV_READ, ApiKeyScope.CV_WRITE)
 */
export const RequireScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata(API_KEY_SCOPES, scopes);

/**
 * Decorator to specify required organization roles for an endpoint.
 * @example @OrgRoles(OrgRole.ADMIN, OrgRole.OWNER)
 */
export const OrgRoles = (...roles: OrgRole[]) =>
  SetMetadata(ORG_ROLES_KEY, roles);

/**
 * Decorator to specify the route parameter name containing the org ID.
 * @example @OrgParam('organizationId')
 */
export const OrgParam = (paramName: string) =>
  SetMetadata(ORG_PARAM_KEY, paramName);
