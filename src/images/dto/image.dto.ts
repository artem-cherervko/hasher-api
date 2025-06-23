import { IsNotEmpty, IsString } from 'class-validator';

export class SendImageDTO {
	@IsNotEmpty()
	buffer: Buffer;

	@IsString()
	contentType: string;

	@IsString()
	@IsNotEmpty()
	senderUin: string;

	@IsString()
	@IsNotEmpty()
	receiver: string;
}

export class GetImageDTO {
	@IsString()
	key: string;
}

export class DeleteImageDTO {
	@IsString()
	key: string;
}
