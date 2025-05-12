import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [UserModule, ChatsModule],
})
export class AppModule {}
