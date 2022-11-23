import { strict as assert } from 'assert';
import { createLogger, format, transports } from 'winston';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp(), format.splat(), format.json()),
	transports: [new transports.Console()]
});

const sendmail = async (options = {}) => {
	assert.ok(options.sesClient, 'options.sesClient must be required');
	assert.ok(options.message, 'options.message must be required');
	assert.ok(options.sesIdentityArn, 'options.sesIdentityArn must be required');

	const {
		sesClient,
		message: { body: jsonStringBody },
		sesIdentityArn
	} = options;

	const body = JSON.parse(jsonStringBody);

	const { mailTo, bodtText, subject, mailFrom } = body;
	assert.ok(mailTo, 'mailTo must be required');
	assert.ok(bodtText, 'bodtText must be required');
	assert.ok(subject, 'subject must be required');
	assert.ok(mailFrom, 'mailFrom must be required');

	const params = {
		Destination: {
			ToAddresses: [mailTo]
		},
		Content: {
			Simple: {
				Body: {
					Text: {
						Charset: 'UTF-8',
						Data: bodtText
					}
				},
				Subject: {
					Charset: 'UTF-8',
					Data: subject
				}
			}
		},
		FromEmailAddress: mailFrom,
		FromEmailAddressIdentityArn: sesIdentityArn
	};

	const command = new SendEmailCommand(params);
	await sesClient.send(command);

	logger.info({ message: 'mailsend success', mailTo }); // メアドはハッシュ化等匿名化すべき
};

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
	assert.ok(
		event && event.Records && event.Records.length,
		'event and event.Records must be required'
	);

	const {
		STAGE: stage,
		REGION: region,
		SES_IDENTITY_ARN: sesIdentityArn
	} = process.env;
	assert.ok(stage, 'stage must be required');
	assert.ok(region, 'region must be required');
	assert.ok(sesIdentityArn, 'sesIdentityArn must be required');

	const isLocal = stage === 'local';

	const sesClient = new SESv2Client(
		isLocal ? { endpoint: 'http://localhost:8005', region } : { region }
	);

	try {
		await Promise.all(
			event.Records.map(async (message) => {
				try {
					await sendmail({ sesClient, message, sesIdentityArn });
				} catch (e) {
					logger.error({ message: e.message, stack: e.stack });
				}
			})
		);
	} catch (e) {
		logger.error({ message: e.message, stack: e.stack });
	}
};
