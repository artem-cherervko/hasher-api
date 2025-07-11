import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('status')
	status(): {
		message: string;
		version: string;
		timestamp: string;
	} {
		return this.appService.status();
	}
}
