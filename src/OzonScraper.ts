import { ScrapedItem } from './models/ScrapedItem';
import { delay } from './utils/delay';
import puppeteer from 'puppeteer-extra';
import PluginStealth = require('puppeteer-extra-plugin-stealth');
import { ElementHandle } from 'puppeteer';
import * as jsdom from 'jsdom';

export class OzonScraper {
    constructor(private readonly _searchResultsUrl: string) {}

    async load(count: number): Promise<ScrapedItem[]> {
        const { page, browser } = await this.initBrowser(
            this._searchResultsUrl
        );
        await delay(1000);
        const { JSDOM } = jsdom;
        const { document } = new JSDOM(await page.content()).window;
        const elements = Array.from(document.querySelectorAll('.jz5.j5z'));
        const data: ScrapedItem[] = [];
        for (const el of elements.slice(0, count)) {
            data.push({
                title: this.getTitle(el),
                price: this.getPrice(el),
                url: 'https://www.ozon.ru' + this.getUrl(el),
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

    private getPrice(elem: Element): number {
        const priceBlock = elem.querySelector('.ui-o7.ui-p0');
        const result = priceBlock?.textContent;
        return Number(
            result
                ?.replace('/&thinsp;/gi', '')
                .replace('₽', '')
                .replace(' ', '')
                .trim()
        );
    }

    private getTitle(elem: Element): string {
        return elem.querySelector('.tsBodyL')?.textContent ?? '';
    }

    private getUrl(elem: Element): string {
        return (
            elem.querySelector('.tile-hover-target')?.getAttribute('href') ?? ''
        );
    }
}
