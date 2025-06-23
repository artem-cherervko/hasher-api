import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { s3 } from './lib/cloudflare';
import { PrismaService } from 'src/prisma.service';

@Module({
	controllers: [ImagesController],
	providers: [
		ImagesService,
		{
			provide: 'S3',
			useValue: s3,
		},
		PrismaService,
	],
})
export class ImagesModule {}
