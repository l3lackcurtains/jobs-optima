import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AiUsageGuard implements CanActivate {
  private redis: Redis;
  private readonly dailyLimit: number;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url');
    if (redisUrl) {
      const url = new URL(redisUrl);
      this.redis = new Redis({
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    } else {
      this.redis = new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }
    this.dailyLimit = parseInt(
      process.env.AI_DAILY_LIMIT || '20',
      10,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string = request.user?.userId;
    if (!userId) return false;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `ai:usage:${userId}:${today}`;

    const count = await this.redis.incr(key);
    if (count === 1) {
      // First call today — set TTL to seconds until end of day
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const ttl = Math.ceil((midnight.getTime() - now.getTime()) / 1000);
      await this.redis.expire(key, ttl);
    }

    if (count > this.dailyLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Daily AI usage limit of ${this.dailyLimit} requests reached. Resets at midnight UTC.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
