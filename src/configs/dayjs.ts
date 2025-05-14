import dayjs from 'dayjs';

export async function getDate() {
	return dayjs().locale('uk').format('YYYY-MM-DD HH:mm:ss');
}
