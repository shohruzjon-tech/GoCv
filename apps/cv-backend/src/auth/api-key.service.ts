import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyDocument } from './schemas/api-key.schema.js';
import { ApiKeyScope, ApiKeyStatus } from '../common/enums/api-key-scope.enum.js';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectModel(ApiKey.name) private apiKeyModel: Model<ApiKeyDocument>,
  ) {}

  // ─── Create API Key ───

  async createKey(
    userId: string,
    name: string,
    scopes: ApiKeyScope[],
    organizationId?: string,
    expiresInDays?: number,
    rateLimit?: { requestsPerMinute: number; requestsPerDay: number },
  ): Promise<{ key: string; apiKey: ApiKeyDocument }> {
    // Generate a secure random API key
    const rawKey = `gocv_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = new this.apiKeyModel({
      name,
      keyHash,
      keyPrefix,
      userId: new Types.ObjectId(userId),
      organizationId: organizationId ? new Types.ObjectId(organizationId) : undefined,
      scopes,
      status: ApiKeyStatus.ACTIVE,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      rateLimit: rateLimit || { requestsPerMinute: 60, requestsPerDay: 10000 },
    });

    const saved = await apiKey.save();
    this.logger.log(`API key created: ${keyPrefix}... for user ${userId}`);

    // Return the raw key only once — it cannot be retrieved again
    return { key: rawKey, apiKey: saved };
  }

  // ─── Validate API Key ───

  async validateKey(
    rawKey: string,
  ): Promise<{
    valid: boolean;
    apiKey?: ApiKeyDocument;
    reason?: string;
  }> {
    const keyHash = this.hashKey(rawKey);
    const apiKey = await this.apiKeyModel.findOne({ keyHash }).exec();

    if (!apiKey) {
      return { valid: false, reason: 'Invalid API key' };
    }

    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      return { valid: false, reason: `API key is ${apiKey.status}` };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.status = ApiKeyStatus.EXPIRED;
      await apiKey.save();
      return { valid: false, reason: 'API key has expired' };
    }

    // Update usage stats
    apiKey.lastUsedAt = new Date();
    apiKey.usageCount += 1;
    await apiKey.save();

    return { valid: true, apiKey };
  }

  // ─── Check Scope ───

  hasScope(apiKey: ApiKeyDocument, requiredScope: ApiKeyScope): boolean {
    if (apiKey.scopes.includes(ApiKeyScope.FULL_ACCESS)) return true;
    return apiKey.scopes.includes(requiredScope);
  }

  // ─── Check IP Whitelist ───

  isIpAllowed(apiKey: ApiKeyDocument, ip: string): boolean {
    if (apiKey.allowedIps.length === 0) return true;
    return apiKey.allowedIps.includes(ip);
  }

  // ─── CRUD ───

  async findByUser(userId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({ userId: new Types.ObjectId(userId), status: ApiKeyStatus.ACTIVE })
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByOrganization(organizationId: string): Promise<ApiKeyDocument[]> {
    return this.apiKeyModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        status: ApiKeyStatus.ACTIVE,
      })
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async revokeKey(keyId: string, revokedBy: string): Promise<void> {
    const apiKey = await this.apiKeyModel.findById(keyId).exec();
    if (!apiKey) throw new NotFoundException('API key not found');

    apiKey.status = ApiKeyStatus.REVOKED;
    apiKey.revokedAt = new Date();
    apiKey.revokedBy = new Types.ObjectId(revokedBy);
    await apiKey.save();

    this.logger.log(`API key ${apiKey.keyPrefix}... revoked by user ${revokedBy}`);
  }

  async rotateKey(
    keyId: string,
    userId: string,
  ): Promise<{ key: string; apiKey: ApiKeyDocument }> {
    const oldKey = await this.apiKeyModel.findById(keyId).exec();
    if (!oldKey) throw new NotFoundException('API key not found');
    if (oldKey.userId.toString() !== userId) {
      throw new ForbiddenException('Not authorized to rotate this key');
    }

    // Revoke old key
    oldKey.status = ApiKeyStatus.REVOKED;
    oldKey.revokedAt = new Date();
    await oldKey.save();

    // Create new key with same settings
    return this.createKey(
      userId,
      oldKey.name,
      oldKey.scopes,
      oldKey.organizationId?.toString(),
      oldKey.expiresAt
        ? Math.ceil((oldKey.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        : undefined,
      oldKey.rateLimit as any,
    );
  }

  // ─── Helpers ───

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }
}
