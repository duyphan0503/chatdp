import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service.js';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
