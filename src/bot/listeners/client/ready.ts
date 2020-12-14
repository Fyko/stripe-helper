import { Listener } from 'discord-akairo';
import { ActivityType, Guild } from 'discord.js';

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client',
		});
	}

	public async exec(): Promise<void> {
		this.client.logger.info(`[READY] ${this.client.user?.tag} is ready.`);

		for (const [id] of this.client.guilds.cache) {
			const exists = this.client.settings.cache.guilds.has(id);
			if (!exists) this.client.settings.new('guild', { id });
		}
	}
}
