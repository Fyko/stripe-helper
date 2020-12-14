import { Command, Flag, PrefixSupplier } from 'discord-akairo';
import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { FailureData } from 'discord-akairo';

export default class extends Command {
	public constructor() {
		super('customers', {
			aliases: ['customers', 'customer', 'cust', 'c'],
			description: {
				content: stripIndents`
					The Stripe customers module.

					Subcommands:
					- \`list\`
				`,
				usage: '<method> <...arguments>',
			},
			category: 'customers',
			channel: 'guild',
			ownerOnly: true,
		});
	}

	public *args() {
		const method = yield {
			type: [
				['customers-list', 'list', 'ls'],
				['customers-get', 'get', 'fetch', 'find', 'cat'],
			],
			otherwise: (msg: Message, data: FailureData) => {
				const prefix = (this.handler.prefix as PrefixSupplier)(msg);
				return stripIndents`
					Invalid subcommand \`${data.phrase ?? 'null'}\`.
					Run \`${prefix}help ${this.aliases[0]}\` for more information.
				`;
			},
		};

		return Flag.continue(method);
	}
}
