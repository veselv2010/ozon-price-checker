import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import * as puppeteer from "puppeteer";
import fs = require("fs");
import { ScrapedItem } from "./models/ScrapedItem";

const cachePath = ".cache/cache.json";
const bot: Telegraf<Context<Update>> = new Telegraf(
    process.env.BOT_KEY as string
);

bot.start((ctx) => {
    ctx.reply("Hello " + ctx.from.first_name + "!");
    saveChatIdToCache(ctx.message.chat.id.toString());
});

bot.command("quit", (ctx) => {
    ctx.leaveChat();
    removeChatIdFromCache(ctx.message.chat.id.toString());
});

function sendMessage(info: ScrapedItem[]): void {
    const chatIds = getCachedChatIds();
    const composedMessages = info
        .map((item, index) => item.toMessage(index))
        .join("\n");
    chatIds.forEach((id) => {
        bot.telegram.sendMessage(id, composedMessages);
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
    const file = fs.readFileSync(cachePath, "utf8");
    return JSON.parse(file) as Array<string>;
}

function saveCacheArray(cache: Array<string>): void {
    fs.writeFileSync(cachePath, JSON.stringify(cache), "utf-8");
}

const URL =
    "https://www.ozon.ru/category/videokarty-15721/?deny_category_prediction=true&from_global=true&sorting=ozon_card_price&text=rtx+3080";

const main = async () => {
    const items = await parseItems();
    console.log(items);
    // sendMessage(items);
};

const parseItems = async (): Promise<Array<ScrapedItem>> => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(URL);
    await new Promise((r) => setTimeout(r, 100));
    const items = await page.$$(".j4z");
    const data: Array<ScrapedItem> = [];
    for (let i = 0; i < items.length; i++) {
        const title = await getTitle(items[i]);
        const price = await getPrice(items[i]);
        const url = await getUrl(items[i]);
        data.push(new ScrapedItem(title, price, url));
    }
    return data;
};

const getPrice = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<number> => {
    const priceBlock = await elem.$(".ui-o7");
    const result = await priceBlock.evaluate((el) => el.textContent);
    return Number(result.replace("/&thinsp;/gi", "").replace("₽", ""));
};

const getTitle = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<string> => {
    const titleBlock = await elem.$(".tsBodyL");
    return titleBlock.evaluate((el) => el.textContent);
};

const getUrl = async (
    elem: puppeteer.ElementHandle<Element>
): Promise<string> => {
    const hrefBlock = await elem.$(".tile-hover-target");
    return hrefBlock.evaluate((el) => el.getAttribute("href"));
};

main();
