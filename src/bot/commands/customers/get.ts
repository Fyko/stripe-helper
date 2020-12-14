import { stripIndents } from 'common-tags';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import Stripe from 'stripe';
import { customerURL, invoiceURL } from '../../util';

export default class extends Command {
	public constructor() {
		super('customers-get', {
			typing: true,
			category: 'customers',
			channel: 'guild',
			args: [
				{
					id: 'param',
					prompt: {
						start: 'who would you like to search for?',
						retry: 'please provide a search parameter.',
					},
				},
			],
		});
	}

	public async exec(msg: Message, { param }: { param: string }): Promise<Message | Message[] | void> {
		let customer!: Stripe.Customer;
		if (param.startsWith('cus_')) {
			try {
				customer = (await this.client.stripe.customers.retrieve(param)) as Stripe.Customer;
			} catch (err) {
				return msg.util?.send(`An error occurred when trying to fetch that customer: \`${err}\`.`);
			}
		}
		if (!customer) {
			try {
				const { data } = await this.client.stripe.customers.list({ email: param, limit: 5 });
				if (!data.length) throw Error('No entries found.');
				customer = data[0];
			} catch (err) {
				return msg.util?.send(`An error occurred when trying to fetch that customer: \`${err}\`.`);
			}
		}

		const { data: invoices } = await this.client.stripe.invoices.list({ customer: customer.id, limit: 100 });
		const { data: payments } = await this.client.stripe.paymentIntents.list({ customer: customer.id, limit: 100 });
		const { data: methods } = await this.client.stripe.paymentMethods.list({
			customer: customer.id,
			type: 'card',
			expand: ['data.card'],
		});

		const totalCents = payments.reduce((acc, v) => (acc += v.amount), 0);

		const embed = this.client.util
			.embed()
			.setTitle(`${customer.name}`)
			.setURL(customerURL(customer.id))
			.setColor(this.client.config.color)
			.setDescription(
				stripIndents`
				Id: \`${customer.id}\`
				Email: \`${customer.email}\`
				Total Spent: ||\`$${(totalCents / 100).toFixed(2)}\`||
			`,
			);

		if (invoices.length)
			embed.addField(
				'Invoices',
				invoices
					.map(i => `• \`${i.number}\`: ${i.status?.toUpperCase()} $${i.total / 100} [open](${invoiceURL(i.id)})`)
					.join('\n')
					.substring(0, 1024),
			);

		if (methods.length)
			embed.addField(
				'Payment Methods',
				methods.map(
					m =>
						`• ||${m.billing_details.name ?? ''} ${m.card?.brand} \`${m.card?.last4} ${m.card?.exp_month}/${
							m.card?.exp_year
						}\`||`,
				),
			);

		return msg.util?.send({ embed });
	}
}
