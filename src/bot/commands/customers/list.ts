import { Argument, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { paginate, customerURL } from '../../util';
import { stripIndents } from 'common-tags';
import Stripe from 'stripe';

export default class extends Command {
	public constructor() {
		super('customers-list', {
			typing: true,
			category: 'customers',
			channel: 'guild',
			args: [
				{
					id: 'page',
					match: 'content',
					type: Argument.compose(
						(_, str) => str.replace(/\s/g, ''),
						Argument.range(Argument.union('number', 'emojint'), 1, Infinity),
					),
					default: 1,
				},
				{
					id: 'force',
					match: 'flag',
					flag: ['--force', '-F'],
				},
			],
		});
	}

	private _customers: Stripe.Customer[] = [];

	public async exec(
		msg: Message,
		{ page, force }: { page: number; force: boolean },
	): Promise<Message | Message[] | void> {
		if (force || !this._customers.length) {
			const customers = await this.client.stripe.customers.list({ limit: 100 });
			this._customers = customers.data;
			this.client.setTimeout(() => (this._customers = []), 1000 * 60 * 5);
		}

		const paginated = paginate(this._customers, page, 10);
		let index = (paginated.page - 1) * 10;

		const embed = this.client.util.embed().setColor(this.client.config.color).setDescription(stripIndents`
				**Clients, page ${paginated.page}/${paginated.maxPage}:**

				${
					paginated.items.length
						? paginated.items
								.map(c => `**${++index}.** [${c.name} <\`${c.email}\`> (\`${c.id}\`)](${customerURL(c.id)})`)
								.join('\n')
						: 'Nothing to see here!'
				}
			`);

		return msg.util?.send({ embed });
	}
}
