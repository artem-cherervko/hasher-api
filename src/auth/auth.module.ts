import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

@Global()
@Module({
	imports: [
		ConfigModule,
		JwtModule.registerAsync({
			global: true,
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '15m' },
			}),
		}),
		UserModule,
	],
	providers: [AuthService, PrismaService],
	exports: [AuthService, JwtModule],
	controllers: [AuthController],
})
export class AuthModule {}
