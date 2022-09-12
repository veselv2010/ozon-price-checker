import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { BotSubscribersCachedSet } from './BotSubscribersCachedSet';
import { ScrapedItem } from './models/ScrapedItem';
import { OzonScraper } from './OzonScraper';
import { ILogManager } from './logger/ILogManager';

export class OzonBot {
    private readonly _telegraf: Telegraf<Context<Update>>;

    constructor(
        token: string,
        private readonly _botSubscribers: BotSubscribersCachedSet,
        private readonly _ozonScraper: OzonScraper,
        private readonly _logger: ILogManager
    ) {
        this._telegraf = new Telegraf(token);

        this._telegraf.start((ctx) => {
            const replyMessaage = `Hello ${ctx.from.first_name}!`;
            _logger.i(replyMessaage);

            ctx.reply(replyMessaage);
            this._botSubscribers.add(ctx.message.chat.id.toString());
        });

        this._telegraf.command('quit', (ctx) => {
            const chatId = ctx.message.chat.id.toString();
            const replyMessage = `Removed ${chatId}`;
            this._botSubscribers.remove(chatId);

            _logger.i(replyMessage);
            ctx.reply(replyMessage);
        });
    }

    async launch(updateIntervalMs: number): Promise<void> {
        await this._telegraf.launch();
        process.once('SIGINT', () => this._telegraf.stop('SIGINT'));
        process.once('SIGTERM', () => this._telegraf.stop('SIGTERM'));
        this._ozonScraper
            .load(10)
            .then((items) => this.notifySubscribers(items));

        setInterval(
            () =>
                this._ozonScraper
                    .load(10)
                    .then((items) => this.notifySubscribers(items)),
            updateIntervalMs
        );
    }

    private formatScrapedItem({ url, title, price }: ScrapedItem): string {
        return `${price} ₽ <a href="${url}">${title}</a>`;
    }

    async notifySubscribers(items: ScrapedItem[]): Promise<void> {
        this._logger.i(`Scraped ${items.length} items`);
        const chatIds = this._botSubscribers.getChatIds();
        const messageText = items.map(this.formatScrapedItem).join('\n');

        if (messageText.length == 0) {
            this._logger.e('Message text is empty!');
            return;
        }

        for (const id of chatIds) {
            await this._telegraf.telegram.sendMessage(id, messageText, {
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        }
    }
}
