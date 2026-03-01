import {
  Injectable,
  NestMiddleware,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminAnalyticsService } from '../../admin/admin-analytics.service.js';

/**
 * Request logging middleware for observability.
 * Logs method, URL, status code, response time, and correlation ID.
 * Also feeds request metrics into AdminAnalyticsService for real-time dashboard.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(
    @Optional()
    @Inject(AdminAnalyticsService)
    private analyticsService?: AdminAnalyticsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';
    const correlationId = (req as any).correlationId || '-';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '-';

      const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms ${contentLength}b [${correlationId}]`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }

      // Feed into analytics for real-time dashboard
      if (this.analyticsService) {
        this.analyticsService.trackRequest(method, statusCode);
      }
    });

    next();
  }
}
