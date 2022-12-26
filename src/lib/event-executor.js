import { strict as assert } from 'assert';
import Stripe from 'stripe';

const events = {
	stripe: {
		'payment_method.attached': async (options = {}) => {
			assert.ok(options.data, 'data must be required');
			assert.ok(options.stripe, 'stripe must be required');

			const { data, stripe } = options;
			const { id: paymentMethodId, customer: customerId } = data;

			await stripe.customers.update(customerId, {
				invoice_settings: { default_payment_method: paymentMethodId }
			});
		}
	}
};

export default class EventExecutor {
	constructor(options = {}) {
		assert.ok(options.stripeSecretKey, 'stripeSecretKey must be required');

		const { stripeSecretKey } = options;
		this.stripe = new Stripe(stripeSecretKey);
	}

	async execute(options = {}) {
		assert.ok(options.category, 'category must be required');
		assert.ok(options.type, 'type must be required');
		assert.ok(options.data, 'data must be required');
		assert.ok(options.logger, 'logger must be required');

		const { category, type, data, logger } = options;
		if (!Object.keys(events).includes(category) || !Object.keys(events[category]).includes(type)) {
			logger.info({ message: `${category}.${type} event from kinesis skip` });
			return;
		}

		await events[category][type]({ data, stripe: this.stripe });
		logger.info({ message: `${category}.${type} event from kinesis is executed` });
	}
}
