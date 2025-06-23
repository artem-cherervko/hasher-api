import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: process.env.ORIGIN,
		// origin: '*',
		credentials: true,
	});
	app.use(cookieParser({}));
	app.setGlobalPrefix('/api/v1');
	app.useWebSocketAdapter(new IoAdapter(app));
	await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
