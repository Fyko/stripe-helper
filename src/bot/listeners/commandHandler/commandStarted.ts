import { Listener, Command } from 'discord-akairo';
import { Message, WebhookClient } from 'discord.js';

export default class CommandStartedListener extends Listener {
	public constructor() {
		super('commandStarted', {
			category: 'commandHandler',
			emitter: 'commandHandler',
			event: 'commandStarted',
		});
	}

	public exec(msg: Message, command: Command): void {
		if (msg.util!.parsed!.command) return;
		const where = msg.guild ? msg.guild.name : msg.author.tag;
		this.client.logger.info(`[COMMAND STARTED] ${command.id} in ${where}`);
	}
}
