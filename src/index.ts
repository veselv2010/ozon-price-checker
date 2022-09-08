import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.BOT_KEY as string);

bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
});

bot.command('quit', (ctx) => {
    // Explicit usage
    ctx.telegram.leaveChat(ctx.message.chat.id);// Context shortcut
    ctx.leaveChat();
});

