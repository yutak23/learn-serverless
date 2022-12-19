exports.handler = async (event) => {
	try {
		await Promise.all(
			// eslint-disable-next-line array-callback-return
			event.Records.map((record) => {
				try {
					const { data: eventData } = record.kinesis;
					const { category, type, payload } = JSON.parse(Buffer.from(eventData, 'base64'));

					console.log('category', category);
					console.log('type', type);
					console.log('payload', payload);
				} catch (e) {
					console.error(e);
				}
			})
		);
	} catch (e) {
		console.error(e);
	}
};
