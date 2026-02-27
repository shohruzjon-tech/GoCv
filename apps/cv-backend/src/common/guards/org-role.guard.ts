import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationsService } from '../../organizations/organizations.service.js';
import { OrgRole } from '../enums/org-role.enum.js';

export const ORG_ROLES_KEY = 'org_roles';
export const ORG_PARAM_KEY = 'org_param';

/**
 * Guard that enforces organization-level role-based access control.
 * Use with @OrgRoles(OrgRole.ADMIN) and @OrgParam('orgId') decorators.
 */
@Injectable()
export class OrgRoleGuard implements CanActivate {
  private readonly logger = new Logger(OrgRoleGuard.name);

  constructor(
    private reflector: Reflector,
    private organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<OrgRole[]>(
      ORG_ROLES_KEY,
      context.getHandler(),
    );

    // If no org roles required, skip
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?._id?.toString();

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Get org ID from route params or body
    const orgParamName =
      this.reflector.get<string>(ORG_PARAM_KEY, context.getHandler()) ||
      'orgId';
    const orgId =
      request.params?.[orgParamName] ||
      request.body?.organizationId ||
      request.query?.orgId;

    if (!orgId) {
      throw new ForbiddenException('Organization ID required');
    }

    const userRole = await this.organizationsService.getUserRole(userId, orgId);
    if (!userRole) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const ROLE_HIERARCHY: Record<OrgRole, number> = {
      [OrgRole.OWNER]: 100,
      [OrgRole.ADMIN]: 80,
      [OrgRole.RECRUITER]: 60,
      [OrgRole.MEMBER]: 40,
      [OrgRole.VIEWER]: 20,
    };

    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = Math.min(
      ...requiredRoles.map((r) => ROLE_HIERARCHY[r] || 0),
    );

    if (userLevel < minLevel) {
      throw new ForbiddenException(
        `Requires ${requiredRoles.join(' or ')} role. Current role: ${userRole}`,
      );
    }

    // Attach org context to request
    request.orgRole = userRole;
    request.orgId = orgId;

    return true;
  }
}
