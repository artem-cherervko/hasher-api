import { IsNotEmpty, IsString } from 'class-validator';

export class NewMessageDTO {
	@IsString()
	@IsNotEmpty()
	receiver_uin: string;

	@IsString()
	@IsNotEmpty()
	message: string;
}

export class MessageDTO {
	@IsString()
	@IsNotEmpty()
	sender_uin: string;

	@IsString()
	@IsNotEmpty()
	receiver_uin: string;

	@IsString()
	@IsNotEmpty()
	message: string;
}

export class UpdateMessageDTO {
	@IsString()
	@IsNotEmpty()
	id: string;

	@IsString()
	@IsNotEmpty()
	new_text: string;
}
