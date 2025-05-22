import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	async login(@Body() uin: string) {
		return await this.authService.generateTokens(uin);
	}

	@Post('logout')
	async logout(@Body() uin: string) {
		return await this.authService.logout(uin);
	}

	@Get('tokens')
	async getTokens(@Body() uin: string) {
		return await this.authService.generateTokens(uin);
	}

	@Get('checkAccess')
	async checkAccess(@Query('token') token: string) {
		return await this.authService.validateAccessToken(token);
	}

	@Get('checkRefresh')
	async checkRefresh(@Query('token') token: string) {
		return await this.authService.validateRefreshToken(token);
	}
}
