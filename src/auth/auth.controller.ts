import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Res,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
	) {}

	@Post('login')
	async login(
		@Body() data: { uin: string; password: string },
		@Res({ passthrough: true }) res: Response,
	) {
		res.clearCookie('u');
		res.clearCookie('r');

		return await this.authService.login(data.uin, data.password);
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

	@Get('getUIN')
	async getUin(@Query('token') token: string) {
		return await this.authService.getUinFromAccessToken(token);
	}

	@Get('sendOAuthCode')
	async sendOAuthCode(@Query('email') email: string) {
		const user = await this.userService.findUserByUIN(email);
		if (!user) {
			return await this.authService.sendOAuthCode(email);
		} else {
			return await this.authService.sendOAuthCode(user.email);
		}
	}

	@Get('checkOAuth')
	async checkOAuth(@Query('email') email: string, @Query('code') code: string) {
		const user = await this.userService.findUserByUIN(email);
		if (!user) {
			return await this.authService.checkOAuth(email, code);
		} else {
			return await this.authService.checkOAuth(user.email, code);
		}
	}

	@Get('checkUIN')
	async checkUIN(@Query('uin') uin: string) {
		return await this.authService.checkUIN(uin);
	}
}
