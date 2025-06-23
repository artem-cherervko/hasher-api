import * as dayjs from 'dayjs';

export function GenerateKey(): string {
	const randomName = Math.random().toString(36).substring(2, 10);
	const dateStr = dayjs().format('DD.MM.YY');
	return `${dateStr}-${randomName}`;
}
