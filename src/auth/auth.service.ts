import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
		public readonly jwt: JwtService,
		private readonly emailService: EmailService,
		private readonly redis: RedisService,
	) {}

	async generateTokens(uin: any) {
		uin = typeof uin === 'object' ? uin.uin : uin;
		const accessToken: string = await this.jwt.signAsync(
			{ uin },
			{
				secret: this.config.get('JWT_SECRET'),
				expiresIn: '1h',
			},
		);

		const refreshToken: string = await this.jwt.signAsync(
			{ uin, accessToken },
			{ secret: this.config.get('JWT_SECRET'), expiresIn: '3d' },
		);

		const hashed_refresh_token = await argon2.hash(refreshToken);
		await this.prisma.user.update({
			where: {
				uin: uin,
			},
			data: {
				refresh_token: hashed_refresh_token,
			},
		});

		return {
			status: HttpStatus.OK,
			accessToken: accessToken,
			refreshToken: refreshToken,
		};
	}

	async validateAccessToken(accessToken: string) {
		try {
			const payload = await this.jwt.verifyAsync(accessToken, {
				secret: this.config.get('JWT_SECRET'),
			});

			const user = await this.prisma.user.findUnique({
				where: { uin: payload.uin },
			});

			if (!user) {
				throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
			}

			return {
				status: HttpStatus.OK,
				message: 'Token is valid',
				payload,
			};
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
			}

			throw new HttpException(
				'Token verification failed',
				HttpStatus.UNAUTHORIZED,
			);
		}
	}

	async validateRefreshToken(refreshToken: string) {
		try {
			const payload = await this.jwt.verifyAsync(refreshToken, {
				secret: this.config.get('JWT_SECRET'),
			});

			const user = await this.prisma.user.findUnique({
				where: { uin: payload.uin },
			});
			if (!user) {
				throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
			}

			return this.generateTokens(user.uin);
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
			}

			throw new HttpException(
				'Token verification failed',
				HttpStatus.UNAUTHORIZED,
			);
		}
	}

	async logout(uin: any) {
		uin = typeof uin === 'object' ? uin.uin : uin;
		await this.prisma.user.update({
			where: { uin },
			data: { refresh_token: '' },
		});
		return {
			status: HttpStatus.OK,
			message: 'Logged out successfully',
		};
	}

	async login(uin: any, password: string) {
		uin = typeof uin === 'object' ? uin.uin : uin;
		const user = await this.prisma.user.findUnique({
			where: { uin },
		});
		if (!user) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		} else {
			const isPasswordValid = await argon2.verify(user.password, password);
			if (!isPasswordValid) {
				throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
			}

			return await this.generateTokens(user.uin);
		}
	}

	async getUinFromAccessToken(token: string) {
		try {
			const payload = await this.jwt.verifyAsync(token, {
				secret: this.config.get('JWT_SECRET'),
			});
			return payload.uin as string;
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
			}
			throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
		}
	}

	async sendOAuthCode(email: string) {
		const email_response = await this.emailService.sendOAuth({ email });
		return email_response;
	}

	async checkOAuth(email: string, code: string) {
		const redisCode = await this.redis.getKey(
			`${process.env.REDIS_PREFIX}:${email}`,
		);
		if (redisCode.data === code) {
			await this.redis.delete(`${process.env.REDIS_PREFIX}:${email}`);
			return {
				status: HttpStatus.OK,
				message: 'Code is valid',
			};
		}
		throw new HttpException('Invalid code', HttpStatus.BAD_REQUEST);
	}

	async checkUIN(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin },
			});
			if (!user) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			} else {
				return {
					status: HttpStatus.OK,
					message: `UIN ${uin}`,
				};
			}
		} catch {
			throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
		}
	}
}
