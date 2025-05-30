import { randomInt } from 'crypto';

export async function generateCode(): Promise<string> {
	const code = (await randomInt(100000, 1000000)).toString(); // always 6 digits
	return `${code.slice(0, 3)}-${code.slice(3)}`;
}
