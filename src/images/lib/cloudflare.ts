import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
	region: 'auto',
	endpoint: process.env.ENDPOINT,
	credentials: {
		accessKeyId: process.env.ACCESS_ID!,
		secretAccessKey: process.env.ACCESS_KEY!,
	},
});
