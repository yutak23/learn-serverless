import { strict as assert } from 'assert';
import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

export default class Ssm {
	constructor(options = {}) {
		assert.ok(options.stage, 'stage must be required');
		assert.ok(options.region, 'region must be required');

		const { stage, region } = options;
		const isLocal = stage === 'local';

		this.ssmClient = new SSMClient(
			isLocal ? { region, endpoint: 'http://localhost:4566' } : { region }
		);
	}

	async getParameters(options = {}) {
		assert.ok(options.ssmParamNameStripeSecretKey, 'ssmParamNameStripeSecretKey must be required');

		const { ssmParamNameStripeSecretKey } = options;

		const { Parameters: params } = await this.ssmClient.send(
			new GetParametersCommand({
				Names: [ssmParamNameStripeSecretKey],
				WithDecryption: true
			})
		);

		return {
			stripeSecretKey: params.find((param) => param.Name === ssmParamNameStripeSecretKey).Value
		};
	}
}
