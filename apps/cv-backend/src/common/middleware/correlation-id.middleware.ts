import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware that attaches a unique correlation ID to every request.
 * Used for distributed tracing across microservices and log correlation.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      uuidv4();

    // Attach to request for downstream use
    (req as any).correlationId = correlationId;

    // Include in response headers for client-side tracing
    res.setHeader('X-Correlation-Id', correlationId);
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}
