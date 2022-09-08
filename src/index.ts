import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import * as puppeteer from "puppeteer";
import fs = require("fs");
import { ScrapedItem } from "./models/ScrapedItem";
import { createTextChangeRange } from "typescript";

const cachePath = ".cache/cache.json";
const bot: Telegraf<Context<Update>> = new Telegraf(
    // process.env.BOT_KEY as string
    "5416657821:AAG48y22DvIQMQXGq_8upJgW1X78hff-Eus"
);

bot.start((ctx) => {
    ctx.reply("Hello " + ctx.from.first_name + "!");
    saveChatIdToCache(ctx.message.chat.id.toString());
});

bot.command("quit", (ctx) => {
    removeChatIdFromCache(ctx.message.chat.id.toString());
    ctx.reply(`Removed ${ctx.message.chat.id}`);
});

function sendMessage(info: ScrapedItem[]): void {
    const chatIds = getCachedChatIds();
    const composedMessages = info
        .map((item, index) => item.toMessage(index))
        .join("\n");
    chatIds.forEach((id) => {
        bot.telegram.callApi("sendMessage", {
            chat_id: id,
            text: composedMessages,
            parse_mode: "HTML",
        });
    });
}

function getCachedChatIds(): string[] {
    try {
        return getCacheArray();
    } catch (err) {
        console.error(err);
        return [];
    }
}

function removeChatIdFromCache(id: string): void {
    try {
        const json = getCacheArray();
        delete json[json.indexOf(id)];
        saveCacheArray(json);
    } catch (err) {
        console.error(err);
    }
}

function saveChatIdToCache(id: string): void {
    try {
        const json = getCacheArray();
        json.push(id);
        saveCacheArray(json);
    } catch (err) {
        console.error(err);
    }
}

function getCacheArray(): Array<string> {
    if (fs.existsSync(cachePath)) {
        const file = fs.readFileSync(cachePath, "utf8");
        return JSON.parse(file) as Array<string>;
    }

    return [];
}

function saveCacheArray(cache: Array<string>): void {
    if (!fs.existsSync(".cache")) {
        fs.mkdirSync(".cache");
    }

    fs.writeFileSync(cachePath, JSON.stringify(cache), "utf-8");
}

const URL =
    "https://www.ozon.ru/category/videokarty-15721/?deny_category_prediction=true&from_global=true&sorting=ozon_card_price&text=rtx+3080";

const main = async () => {
    await bot.launch();
    setInterval(() => timerCallback(), 30000);
    // sendMessage(items);
};

async function timerCallback(): Promise<void> {
    const items = await parseItems();
    sendMessage(items);
}

const parseItems = async (): Promise<Array<ScrapedItem>> => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({
        width: 1024,
        height: 2560,
        deviceScaleFactor: 1,
    });
    await page.goto(URL);
    await new Promise((r) => setTimeout(r, 1000));
    const items = await page.$$(".j4z");
    const data: Array<ScrapedItem> = [];
    for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        const title = await getTitle(item);
        const price = await getPrice(item);
        const url = await getUrl(item);
        data.push(new ScrapedItem(title, price, "https://www.ozon.ru" + url));
    }

    await browser.close();
    return data;
};

const getPrice = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<number> => {
    const priceBlock = await elem.$(".ui-o7.ui-p0.ui-p3");
    const result = await priceBlock?.evaluate((el) => el.textContent);
    return Number(
        result
            ?.replace("/&thinsp;/gi", "")
            ?.replace("₽", "")
            ?.replace(" ", "")
            ?.trim()
    );
};

const getTitle = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<string> => {
    const titleBlock = await elem.$(".tsBodyL");
    return titleBlock?.evaluate((el) => el.textContent);
};

const getUrl = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<string> => {
    const hrefBlock = await elem.$(".tile-hover-target");
    return hrefBlock?.evaluate((el) => el.getAttribute("href"));
};

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
main();
