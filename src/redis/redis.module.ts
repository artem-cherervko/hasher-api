import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as Redis } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

@Module({
	imports: [
		Redis.forRootAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'single',
				url: config.get<string>('REDIS_URL'),
			}),
		}),
	],
	providers: [RedisService, RedisService],
	exports: [RedisService],
})
export class RedisModule {}
