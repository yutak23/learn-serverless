import { nanoid } from 'nanoid';
import library from '@/library';

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
	console.log(event);
	library();

	return {
		statusCode: 200,
		body: JSON.stringify(
			{
				message: 'Go Serverless v3.0! Your function executed successfully!',
				input: event,
				nanoid: nanoid()
			},
			null,
			2
		)
	};
};
