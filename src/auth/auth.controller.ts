import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	async login(@Body() uin: string, @Res({ passthrough: true }) res: Response) {
		res.clearCookie('u');
		res.clearCookie('r');
		return await this.authService.generateTokens(uin);
	}

	@Post('logout')
	async logout(@Body() uin: string, @Res({ passthrough: true }) res: Response) {
		res.clearCookie('u');
		res.clearCookie('r');
		return await this.authService.logout(uin);
	}

	@Get('tokens')
	async getTokens(@Body() uin: string) {
		return await this.authService.generateTokens(uin);
	}

	@Get('check-access')
	async checkAccess(@Query('token') token: string) {
		return await this.authService.validateAccessToken(token);
	}

	@Get('check-refresh')
	async checkRefresh(@Query('token') token: string) {
		return await this.authService.validateRefreshToken(token);
	}
}
