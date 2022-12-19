import { strict as assert } from 'assert';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import { nanoid } from 'nanoid';

export default class Kinesis {
	constructor(options = {}) {
		assert.ok(options.stage, 'stage must be required');
		assert.ok(options.region, 'region must be required');
		assert.ok(options.streamName, 'streamName must be required');

		const { stage, region, streamName } = options;
		const isLocal = stage === 'local';

		this.kinesisClient = new KinesisClient(
			isLocal ? { region, endpoint: 'http://localhost:4566' } : { region }
		);
		this.streamName = streamName;
	}

	async putRecord(options = {}) {
		assert.ok(options.category, 'category must be required');
		assert.ok(options.type, 'type must be required');
		assert.ok(options.data, 'data must be required');
		const { category, type, data } = options;

		const kinesisData = {
			category,
			type,
			service: 'aws-node-serverless-stripe-webhook',
			payload: { version: 1, data }
		};

		const response = await this.kinesisClient.send(
			new PutRecordCommand({
				Data: new TextEncoder().encode(JSON.stringify(kinesisData)),
				PartitionKey: nanoid(),
				StreamName: this.streamName
			})
		);

		return response;
	}
}
