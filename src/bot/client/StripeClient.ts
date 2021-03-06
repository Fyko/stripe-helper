import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo';
import { ColorResolvable, Message } from 'discord.js';
import { join } from 'path';
import Stripe from 'stripe';
import { Logger } from 'winston';
import SettingsProvider from '../../database';
import { intents } from '../util/constants';
import { logger } from '../util/logger';

declare module 'discord-akairo' {
	interface AkairoClient {
		logger: Logger;
		commandHandler: CommandHandler;
		listenerHandler: ListenerHandler;
		config: ClientOptions;
		settings: SettingsProvider;
		stripe: Stripe;
	}
}

interface ClientOptions {
	token: string;
	owners: string | string[];
	color: ColorResolvable;
	prefix: string;
}

export default class Client extends AkairoClient {
	public constructor(config: ClientOptions) {
		super({
			messageCacheLifetime: 300,
			messageCacheMaxSize: 50,
			messageSweepInterval: 900,
			ownerID: config.owners,
			shards: 'auto',
			ws: {
				intents,
			},
		});

		this.config = config;
	}

	public readonly config: ClientOptions;

	public readonly logger: Logger = logger;

	public readonly stripe: Stripe = new Stripe(process.env.STRIPE_API_KEY!, {
		apiVersion: '2020-03-02',
	});

	public readonly commandHandler: CommandHandler = new CommandHandler(this, {
		directory: join(__dirname, '..', 'commands'),
		prefix: (msg: Message): string => {
			if (msg.guild) {
				const doc = this.settings.cache.guilds.get(msg.guild.id);
				if (doc?.prefix) return doc.prefix;
			}
			return this.config.prefix;
		},
		aliasReplacement: /-/g,
		allowMention: true,
		handleEdits: true,
		commandUtil: true,
		commandUtilLifetime: 3e5,
		defaultCooldown: 3000,
		argumentDefaults: {
			prompt: {
				modifyStart: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n...or type \`cancel\` to cancel this command.`,
				modifyRetry: (msg: Message, str: string) =>
					`${msg.author}, ${str}\n... or type \`cancel\` to cancel this command.`,
				timeout: 'You took too long. Command cancelled.',
				ended: 'You took more than 3 tries! Command canclled',
				cancel: 'Sure thing, command cancelled.',
				retries: 3,
				time: 60000,
			},
			otherwise: '',
		},
	});

	public readonly inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', 'inhibitors'),
	});

	public readonly listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', 'listeners'),
	});

	public readonly settings: SettingsProvider = new SettingsProvider(this);

	private async load(): Promise<this> {
		await this.settings.init();

		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
			shard: this,
		});

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);

		this.listenerHandler.loadAll();
		this.commandHandler.loadAll();
		this.inhibitorHandler.loadAll();

		return this;
	}

	public async launch(): Promise<string> {
		await this.load();
		return this.login(this.config.token);
	}
}
