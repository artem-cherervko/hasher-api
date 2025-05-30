import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth';
import { EmailModule } from 'src/email/email.module';

@Module({
	imports: [forwardRef(() => EmailModule)],
	providers: [UserService, PrismaService, JwtAuthGuard],
	controllers: [UserController],
	exports: [UserService],
})
export class UserModule {}
