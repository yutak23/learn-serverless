import { DateTime } from 'luxon';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.splat(), format.json()),
	transports: [new transports.Console()]
});

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
	const response = {
		principalId: 'stripe',
		policyDocument: {
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'execute-api:Invoke',
					Effect: 'Allow',
					Resource: event.methodArn
				}
			]
		}
	};

	try {
		const stripeSignature = event.headers[`Stripe-Signature`];

		if (!stripeSignature || !stripeSignature.split(',').length) {
			response.policyDocument.Statement[0].Effect = 'Deny';
			return response;
		}

		const regex = /^t=([0-9]{10})$/;
		const timestamp = stripeSignature.split(',').shift().match(regex)[1];
		const time5MinutesAgo = DateTime.now().minus({ minutes: 5 }).toUnixInteger();

		if (!(time5MinutesAgo < Number(timestamp))) {
			response.policyDocument.Statement[0].Effect = 'Deny';
			return response;
		}

		return response;
	} catch (e) {
		logger.error({ message: e.message, stack: e.stack });

		response.policyDocument.Statement[0].Effect = 'Deny';
		return response;
	}
};
