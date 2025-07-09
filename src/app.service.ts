import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const packageJson = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
);
const version = packageJson.version;

@Injectable()
export class AppService {
	constructor() {}

	status() {
		return {
			message: 'Server is running',
			version,
			timestamp: new Date().toISOString(),
		};
	}
}
