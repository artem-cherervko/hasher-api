import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
	constructor(@InjectRedis() private readonly redisService: Redis) {}

	async add(key: string, value: any) {
		try {
			await this.redisService.set(key, value);
			return {
				status: HttpStatus.OK,
				message: `Key with value ${value} added`,
			};
		} catch (e) {
			throw new HttpException(
				`Error while adding data to redis: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async delete(key: string) {
		try {
			await this.redisService.del(key);
			return {
				status: HttpStatus.OK,
				message: `${key}: deleted`,
			};
		} catch (e) {
			throw new HttpException(
				`Error while deleting key to redis: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getKey(key: string) {
		try {
			return {
				status: HttpStatus.OK,
				data: `${await this.redisService.get(key)}`,
			};
		} catch (e) {
			throw new HttpException(
				`Error while getting key from redis: ${e}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getAll(prefix: string | null) {
		if (!prefix) {
			return this.redisService.keys('*');
		} else {
			return this.redisService.keys(prefix);
		}
	}
}
