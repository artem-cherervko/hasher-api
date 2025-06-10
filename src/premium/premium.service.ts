import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Premium } from 'generated/prisma';

@Injectable()
export class PremiumService {
	constructor(private readonly prisma: PrismaService) {}

	async getExpire(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin },
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			if (user.premium === 'none') {
				return new HttpException('User has no premium', HttpStatus.BAD_REQUEST);
			}

			return {
				status: HttpStatus.OK,
				premium_until: new Date(user.premium_until).toLocaleString('en-US', {
					timeZone: 'Europe/Kiev',
				}),
			};
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async getPremium(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin },
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			return {
				status: HttpStatus.OK,
				premium: user.premium,
			};
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async addPremium(uin: string, premium: Premium) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin },
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			if (user.premium !== 'none') {
				return new HttpException(
					'User already has premium',
					HttpStatus.BAD_REQUEST,
				);
			}

			await this.prisma.user.update({
				where: { uin },
				data: {
					premium,
					premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				},
			});

			return {
				status: HttpStatus.OK,
				message: 'Premium added',
			};
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async removePremium(uin: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { uin },
			});

			if (!user) {
				return new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			if (user.premium === 'none') {
				return new HttpException('User has no premium', HttpStatus.BAD_REQUEST);
			}

			await this.prisma.user.update({
				where: { uin },
				data: {
					premium: 'none' as Premium,
					premium_until: new Date(),
				},
			});

			return {
				status: HttpStatus.OK,
				message: 'Premium removed',
			};
		} catch (e) {
			throw new HttpException(`Error ${e}`, HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
