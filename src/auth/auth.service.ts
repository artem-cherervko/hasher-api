import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
		public readonly jwt: JwtService,
	) {}

	async generateTokens(uin: any) {
		uin = typeof uin === 'object' ? uin.uin : uin;
		const accessToken: string = await this.jwt.signAsync(
			{ uin },
			{
				secret: this.config.get('JWT_SECRET'),
				expiresIn: '15m',
			},
		);

		const refreshToken: string = await this.jwt.signAsync(
			{ uin, accessToken },
			{ secret: this.config.get('JWT_SECRET'), expiresIn: '7d' },
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
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'User not found',
				};
			}

			return {
				status: HttpStatus.OK,
				message: 'Token is valid',
				payload,
			};
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'Token has expired',
				};
			}

			return {
				status: HttpStatus.UNAUTHORIZED,
				message: `Token verification failed: ${e.message}`,
			};
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
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'User not found',
				};
			}

			return this.generateTokens(user.uin);
		} catch (e) {
			if (e instanceof TokenExpiredError) {
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'Token has expired',
				};
			}

			return {
				status: HttpStatus.INTERNAL_SERVER_ERROR,
				error: e.message,
			};
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
}
