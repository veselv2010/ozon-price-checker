import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { BotSubscribersCachedSet } from './BotSubscribersCachedSet';
import { ScrapedItem } from './models/ScrapedItem';
import { OzonScraper } from './OzonScraper';

export class OzonBot {
    private readonly _telegraf: Telegraf<Context<Update>>;

    constructor(
        token: string,
        private readonly _botSubscribers: BotSubscribersCachedSet,
        private readonly _ozonScraper: OzonScraper,
    ) {
        this._telegraf = new Telegraf(token);

        this._telegraf.start((ctx) => {
            ctx.reply(`Hello ${ctx.from.first_name}!`);
            this._botSubscribers.add(ctx.message.chat.id.toString());
        });

        this._telegraf.command('quit', (ctx) => {
            this._botSubscribers.remove(ctx.message.chat.id.toString());
            ctx.reply(`Removed ${ctx.message.chat.id}`);
        });
    }

    async launch(updateIntervalMs: number): Promise<void> {
        await this._telegraf.launch();
        process.once('SIGINT', () => this._telegraf.stop('SIGINT'));
        process.once('SIGTERM', () => this._telegraf.stop('SIGTERM'));

        setInterval(
            () => this._ozonScraper
                .load(10)
                .then((items) => this.notifySubscribers(items)),
            updateIntervalMs,
        );

        console.log('Bot started');
    }

    private formatScrapedItem({ url, title, price }: ScrapedItem): string {
        return `${price} ₽ <a href="${url}">${title}</a>`;
    }

    async notifySubscribers(items: ScrapedItem[]): Promise<void> {
        const chatIds = this._botSubscribers.getChatIds();
        const messageText = items.map(this.formatScrapedItem).join('\n');

        for (const id of chatIds) {
            await this._telegraf.telegram.sendMessage(id, messageText, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        }
    }
}
