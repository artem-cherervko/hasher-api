import { Body, Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Get('tokens')
	async getTokens(@Body() uin: string) {
		return await this.authService.generateTokens(uin);
	}
}
