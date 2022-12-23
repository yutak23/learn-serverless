import { strict as assert } from 'assert';
import { createLogger, format, transports } from 'winston';
import Ssm from '@/ssm';
import EventExecutor from '@/event-executor';

const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.splat(), format.json()),
	transports: [new transports.Console()]
});

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
	try {
		const {
			STAGE: stage,
			REGION: region,
			SSM_PARAMETER_NAME_STRIPE_SECRET_KEY: ssmParamNameStripeSecretKey,
			KINESIS_STREAM_NAME: kinesisStreamName
		} = process.env;
		assert.ok(stage, 'stage must be required');
		assert.ok(region, 'region must be required');
		assert.ok(ssmParamNameStripeSecretKey, 'ssmParamNameStripeSecretKey must be required');
		assert.ok(kinesisStreamName, 'kinesisStreamName must be required');

		const ssm = new Ssm({ stage, region });
		const { stripeSecretKey } = await ssm.getParameters({
			ssmParamNameStripeSecretKey
		});
		const eventExecutor = new EventExecutor({ stripeSecretKey });

		const errors = [];
		await Promise.all(
			event.Records.map(async (record) => {
				try {
					const { data: eventData } = record.kinesis;
					const { category, type, payload } = JSON.parse(Buffer.from(eventData, 'base64'));
					if (!payload) throw new Error(`payload must be required`);

					const { data } = payload;
					await eventExecutor.execute({ category, type, data, logger });
				} catch (e) {
					errors.push({ message: e.message, stack: e.stack, record });
				}
			})
		);

		if (errors.length) throw new Error(JSON.stringify(errors));
		return { statusCode: 200 };
	} catch (e) {
		logger.error({ message: e.message, stack: e.stack });
		return { statusCode: 500 };
	}
};
