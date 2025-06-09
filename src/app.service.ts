import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	constructor() {}

	status() {
		return {
			message: 'Server is running',
			version: '1.0.0', // TODO: change to package.json version
			timestamp: new Date().toISOString(),
		};
	}
}
