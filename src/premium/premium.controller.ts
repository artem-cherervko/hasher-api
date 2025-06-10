import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PremiumService } from './premium.service';
import { Premium } from 'generated/prisma';

@Controller('premium')
export class PremiumController {
	constructor(private readonly premiumService: PremiumService) {}

	@Get('expire/:uin')
	async getExpire(@Param('uin') uin: string) {
		return this.premiumService.getExpire(uin);
	}

	@Get('/:uin')
	async getPremium(@Param('uin') uin: string) {
		return this.premiumService.getPremium(uin);
	}

	@Post('add/:uin')
	async addPremium(
		@Param('uin') uin: string,
		@Body() body: { premium: Premium },
	) {
		return this.premiumService.addPremium(uin, body.premium);
	}

	@Post('remove/:uin')
	async removePremium(@Param('uin') uin: string) {
		return this.premiumService.removePremium(uin);
	}
}
