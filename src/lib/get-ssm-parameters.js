import { strict as assert } from 'assert';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

export default async (options = {}) => {
	assert.ok(options.stage, 'stage must be required');
	assert.ok(options.region, 'region must be required');
	assert.ok(options.ssmParamNameStripeSecretKey, 'ssmParamNameStripeSecretKey must be required');
	assert.ok(options.ssmParamNameEndpointSecret, 'ssmParamNameEndpointSecret must be required');

	const { stage, region, ssmParamNameStripeSecretKey, ssmParamNameEndpointSecret } = options;
	const isLocal = stage === 'local';

	const ssmClient = new SSMClient(
		isLocal ? { region, endpoint: 'http://localhost:4566' } : { region }
	);
	const { Parameters: params } = await ssmClient.send(
		new GetParametersCommand({
			Names: [ssmParamNameStripeSecretKey, ssmParamNameEndpointSecret],
			WithDecryption: true
		})
	);

	return {
		stripeSecretKey: params.find((param) => param.Name === ssmParamNameStripeSecretKey).Value,
		endpointSecret: params.find((param) => param.Name === ssmParamNameEndpointSecret).Value
	};
};
