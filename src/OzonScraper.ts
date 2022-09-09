import { ScrapedItem } from './models/ScrapedItem';
import { delay } from './utils/delay';
import puppeteer from 'puppeteer-extra';
import PluginStealth = require('puppeteer-extra-plugin-stealth');
import { ElementHandle } from 'puppeteer';

export class OzonScraper {
    constructor(
        private readonly _searchResultsUrl: string,
    ) {
    }

    async load(count: number): Promise<ScrapedItem[]> {
        const { page, browser } = await this.initBrowser(this._searchResultsUrl);
        await delay(1000);

        const elements = await page.$$('.j4z');
        const data: ScrapedItem[] = [];

        for (const el of elements.slice(0, count)) {
            data.push({
                title: await this.getTitle(el),
                price: await this.getPrice(el),
                url: 'https://www.ozon.ru' + await this.getUrl(el)
            });
        }

        await browser.close();
        return data;
    }

    private async initBrowser(searchResultsUrl: string) {
        puppeteer.use(PluginStealth());
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setViewport({
            width: 1024,
            height: 2560,
            deviceScaleFactor: 1,
        });
        await page.goto(searchResultsUrl);
        return { page, browser };
    }

    private async getPrice(
        elem: ElementHandle<Element>
    ): Promise<number> {
        const priceBlock = await elem.$('.ui-o7.ui-p0.ui-p3');
        const result = await priceBlock?.evaluate((el) => el.textContent);

        return Number(
            result
                ?.replace('/&thinsp;/gi', '')
                .replace('₽', '')
                .replace(' ', '')
                .trim()
        );
    }

    private async getTitle(
        elem: ElementHandle<Element>
    ): Promise<string> {
        const titleBlock = await elem.$('.tsBodyL');
        return await titleBlock?.evaluate((el) => el.textContent) || '';
    }

    private async getUrl(
        elem: ElementHandle<Element>
    ): Promise<string> {
        const hrefBlock = await elem.$('.tile-hover-target');
        return await hrefBlock?.evaluate((el) => el.getAttribute('href')) || '';
    }
}
