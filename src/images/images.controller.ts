import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { GetImageDTO, SendImageDTO } from './dto/image.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImagesController {
	constructor(private readonly imagesService: ImagesService) {}

	@Post('image')
	@UseInterceptors(FileInterceptor('file'))
	async upload(
		@UploadedFile() file: Express.Multer.File,
		@Body() body: SendImageDTO,
	) {
		return this.imagesService.sendImage({
			buffer: file.buffer,
			contentType: file.mimetype,
			senderUin: body.senderUin,
			receiver: body.receiver,
		});
	}

	@Get('image')
	async get(@Body() data: GetImageDTO) {
		return this.imagesService.getImage(data);
	}

	@Delete('image')
	async delete(@Query('key') key: string) {
		return await this.imagesService.deleteImage({ key });
	}
}
