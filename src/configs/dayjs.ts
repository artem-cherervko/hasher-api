import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function getDate() {
	return dayjs().tz('Europe/Kiev').format('YYYY-MM-DD HH:mm:ss').toString();
}

export async function getDateObject() {
	return dayjs().tz('Europe/Kiev').toDate();
}
