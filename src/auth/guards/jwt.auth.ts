import {
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		const authHeader = request.headers['authorization'];
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new HttpException(
				'Missing or invalid authorization header',
				HttpStatus.UNAUTHORIZED,
			);
		}

		const accessToken = authHeader.split(' ')[1];

		const validationResult =
			await this.authService.validateAccessToken(accessToken);

		if (validationResult.status !== HttpStatus.OK) {
			throw new HttpException(
				validationResult.message,
				HttpStatus.UNAUTHORIZED,
			);
		}

		// Optionally attach user info to the request if needed
		const tokenPayload = await this.authService.jwt.decode(accessToken);
		request.user = tokenPayload;

		return true;
	}
}
