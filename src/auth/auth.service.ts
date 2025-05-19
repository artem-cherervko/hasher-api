import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
	constructor(
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
		public readonly jwt: JwtService,
	) {}

	async generateTokens(uin: string) {
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
		const token = await this.jwt.decode(accessToken);
		if (!token) {
			return {
				status: HttpStatus.UNAUTHORIZED,
				message: 'Unauthorized',
			};
		} else {
			const user = await this.prisma.user.findUnique({
				where: {
					uin: token.uin,
				},
			});
			if (!user) {
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
				};
			} else {
				return {
					status: HttpStatus.OK,
					message: 'All is Ok',
				};
			}
		}
	}

	async validateRefreshToken(refreshToken: string) {
		const token = await this.jwt.decode(refreshToken);
		if (!token) {
			return {
				status: HttpStatus.UNAUTHORIZED,
				message: 'Unauthorized',
			};
		} else {
			const user = await this.prisma.user.findUnique({
				where: {
					uin: token.uin,
				},
			});
			if (!user) {
				return {
					status: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
				};
			} else {
				const verifiedToken = await argon2.verify(
					user.refresh_token,
					refreshToken,
				);
				if (!verifiedToken) {
					return {
						status: HttpStatus.UNAUTHORIZED,
						message: 'Unauthorized',
					};
				} else {
					return await this.generateTokens(user.uin);
				}
			}
		}
	}
}
