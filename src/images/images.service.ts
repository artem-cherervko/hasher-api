import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DeleteImageDTO, GetImageDTO, SendImageDTO } from './dto/image.dto';
import { PrismaService } from 'src/prisma.service';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { GenerateKey } from './lib/image.key-generator';
import { s3 } from './lib/cloudflare';
import { compressJPG, compressOther } from './lib/image.optimizer';

@Injectable()
export class ImagesService {
	constructor(
		@Inject('S3') private readonly sdk: typeof s3,
		private readonly prismaService: PrismaService,
	) {}

	async sendImage(data: SendImageDTO) {
		if (!data.contentType.startsWith('image/')) {
			throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
		}
		const [user, receiver] = await Promise.all([
			await this.prismaService.user.findUnique({
				where: {
					uin: data.senderUin,
				},
			}),
			await this.prismaService.user.findUnique({
				where: {
					uin: data.receiver,
				},
			}),
		]);

		if (user && receiver) {
			const chat = await this.prismaService.chat.findFirst({
				where: {
					OR: [
						{
							chat_user_one_id: user.id,
							chat_user_two_id: receiver.id,
						},
						{
							chat_user_one_id: receiver.id,
							chat_user_two_id: user.id,
						},
					],
				},
			});
			if (chat) {
				let compressedBuffer: Buffer;
				let extension: string;
				let contentType: string;

				if (data.contentType === 'image/jpeg') {
					compressedBuffer = await compressJPG(data.buffer);
					extension = 'jpg';
					contentType = 'image/jpeg';
				} else {
					compressedBuffer = await compressOther(data.buffer);
					extension = 'webp';
					contentType = 'image/webp';
				}

				const key = `images/${GenerateKey()}.${extension}`;
				const putCommand = new PutObjectCommand({
					Bucket: 'the-killa',
					Key: key,
					Body: compressedBuffer,
					ContentType: contentType,
				});

				await this.sdk.send(putCommand);
				try {
					await this.prismaService.image.create({
						data: {
							key: key,
							imageUrl: `${process.env.CDN_URL}/${key}`,
							chatId: chat?.id,
							senderId: user.id,
							contentType: contentType,
						},
					});

					return {
						status: HttpStatus.OK,
						url: `${process.env.CDN_URL}/${key}`,
					};
				} catch {
					throw new HttpException(
						'Error while sending image!',
						HttpStatus.INTERNAL_SERVER_ERROR,
					);
				}
			}
		} else {
			throw new HttpException('Chat not found!', HttpStatus.BAD_REQUEST);
		}
	}

	async getImage(data: GetImageDTO) {
		try {
			const image = await this.prismaService.image.findUnique({
				where: {
					key: data.key,
				},
			});

			if (!image) {
				throw new HttpException('No image found!', HttpStatus.NOT_FOUND);
			} else {
				return { status: HttpStatus.OK, url: image.imageUrl };
			}
		} catch {
			throw new HttpException(
				'Error while getting image!',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteImage(data: DeleteImageDTO) {
		const image = await this.prismaService.image.findUnique({
			where: {
				key: data.key,
			},
		});

		if (image) {
			try {
				const deleteCommand = new DeleteObjectCommand({
					Bucket: 'the-killa',
					Key: data.key,
				});
				await this.sdk.send(deleteCommand);

				await this.prismaService.image.delete({
					where: {
						key: data.key,
					},
				});

				return {
					status: HttpStatus.OK,
					message: 'Image deleted!',
				};
			} catch {
				throw new HttpException(
					'Error while deleting image!',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		}
	}
}
