import { strict as assert } from 'assert';
import { createLogger, format, transports } from 'winston';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import Stripe from 'stripe';

const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.splat(), format.json()),
	transports: [new transports.Console()]
});

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
	try {
		const sig = event.headers[`Stripe-Signature`];
		const {
			STRIPE_SECRET_KEY: stripeSecretKey,
			STRIPE_ENDPOINT_SECRET: stripeEndpointSecret,
			KINESIS_STREAM_NAME: kinesisStreamName
		} = process.env;
		assert.ok(stripeSecretKey, 'stripeSecretKey must be required');
		assert.ok(stripeEndpointSecret, 'stripeEndpointSecret must be required');
		assert.ok(kinesisStreamName, 'kinesisStreamName must be required');

		const stripe = new Stripe(stripeSecretKey);
		const kinesisClient = new KinesisClient({
			region: 'ap-northeast-1',
			endpoint: 'http://localhost:4566'
		});

		const {
			type,
			data: { object: payload }
		} = stripe.webhooks.constructEvent(event.body, sig, stripeEndpointSecret);

		await kinesisClient.send(
			new PutRecordCommand({
				Data: new TextEncoder().encode(
					JSON.stringify({
						category: 'stripe',
						type,
						service: 'aws-node-serverless-stripe-webhook',
						payload: { version: 1, data: payload }
					})
				),
				PartitionKey: '123',
				StreamName: kinesisStreamName
			})
		);

		logger.info({ message: `sucess putRecord 'stripe' ${type} event data` });
		return { statusCode: 200 };
	} catch (e) {
		logger.error({ message: e.message, stack: e.stack });
		return { statusCode: 500 };
	}
};
