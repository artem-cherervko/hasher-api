import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ChatsModule } from './chats/chats.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [UserModule, ChatsModule, EmailModule],
})
export class AppModule {}
