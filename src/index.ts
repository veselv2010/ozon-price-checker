import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import fs = require('fs');

const cachePath = '.cache/cache.json';
const bot: Telegraf<Context<Update>> = new Telegraf(process.env.BOT_KEY as string);

bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
    saveChatIdToCache(ctx.message.chat.id.toString());
});

bot.command('quit', (ctx) => {
    ctx.leaveChat();
    removeChatIdFromCache(ctx.message.chat.id.toString())
});

function sendMessage(info: ScraptedItem[]): void {
    const chatIds = getCachedChatIds();
    const composedMessages = [...Array(info.length).keys()].map<string>((index) => {
        const item = info.at(index);
        const message = `${index + 1}. ${composeMessage(item)}`;
        return `[${message}](${item.url})`;
    }).join('\n');
    chatIds.forEach((id) => {
        bot.telegram.sendMessage(id, composedMessages);
    });
}

function composeMessage(item: ScraptedItem): string {
    return `${item.name} ${item.getPrice()}](${item.url})`;
}

function getCachedChatIds(): string[] {
    try {
        return getCacheArray();
    }
    catch (err) {
        console.error(err)
        return [];
    }
}

function removeChatIdFromCache(id: string): void {
    try {
        const json = getCacheArray();
        delete json[json.indexOf(id)];
        saveCacheArray(json);
    }
    catch (err) {
        console.error(err);
    }
}

function saveChatIdToCache(id: string): void {
    try {
        const json = getCacheArray();
        json.push(id);
        saveCacheArray(json);
    }
    catch (err) {
        console.error(err);
    }
}

function getCacheArray(): Array<string> {
    const file = fs.readFileSync(cachePath, 'utf8');
    return JSON.parse(file) as Array<string>;

}

function saveCacheArray(cache: Array<string>): void {
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf-8');
}

