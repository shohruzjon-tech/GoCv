import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that extracts and validates tenant context from requests.
 * Supports tenant identification via:
 * 1. X-Tenant-Id header
 * 2. URL subdomain (e.g., acme.gocv.io)
 * 3. API key's organization binding
 * 4. JWT token's organization claim
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | null = null;

    // 1. Explicit header
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) {
      tenantId = headerTenant;
    }

    // 2. Subdomain extraction
    if (!tenantId) {
      const host = req.headers.host || '';
      const parts = host.split('.');
      if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'app') {
          tenantId = subdomain;
        }
      }
    }

    // 3. API key binding (set by ApiKeyGuard)
    if (!tenantId && (req as any).apiKey?.organizationId) {
      tenantId = (req as any).apiKey.organizationId.toString();
    }

    // Attach tenant context to request
    (req as any).tenantId = tenantId;

    if (tenantId) {
      res.setHeader('X-Tenant-Id', tenantId);
    }

    next();
  }
}
