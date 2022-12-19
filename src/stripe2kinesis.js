import { strict as assert } from 'assert';
import { createLogger, format, transports } from 'winston';
import Stripe from 'stripe';
import getSsmParameters from '@/get-ssm-parameters';
import Kinesis from '@/kinesis';

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
			STAGE: stage,
			REGION: region,
			SSM_PARAMETER_NAME_STRIPE_SECRET_KEY: ssmParamNameStripeSecretKey,
			SSM_PARAMETER_NAME_STRIPE_ENDPOINT_SECRET: ssmParamNameEndpointSecret,
			KINESIS_STREAM_NAME: kinesisStreamName
		} = process.env;
		assert.ok(stage, 'stage must be required');
		assert.ok(region, 'region must be required');
		assert.ok(ssmParamNameStripeSecretKey, 'ssmParamNameStripeSecretKey must be required');
		assert.ok(ssmParamNameEndpointSecret, 'ssmParamNameEndpointSecret must be required');
		assert.ok(kinesisStreamName, 'kinesisStreamName must be required');

		const { stripeSecretKey, endpointSecret } = await getSsmParameters({
			stage,
			region,
			ssmParamNameStripeSecretKey,
			ssmParamNameEndpointSecret
		});

		const stripe = new Stripe(stripeSecretKey);
		const kinesis = new Kinesis({ stage, region, streamName: kinesisStreamName });

		const {
			type,
			data: { object: payload }
		} = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);

		// logger.info({ type, payload });
		await kinesis.putRecord({ category: 'stripe', type, data: payload });
		return { status: 202 };
	} catch (e) {
		logger.error({ message: e.message, stack: e.stack });
		return { status: 500 };
	}
};