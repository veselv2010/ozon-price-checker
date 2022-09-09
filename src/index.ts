import * as dotenv from 'dotenv';
import { OzonBot } from './OzonBot';
import { BotSubscribersCachedCollection } from './BotSubscribersCachedCollection';
import { OzonScraper } from './OzonScraper';

dotenv.config();

const OZON_SEARCH_RESULTS_URL =
    'https://www.ozon.ru/category/videokarty-15721/?deny_category_prediction=true&from_global=true&sorting=ozon_card_price&text=rtx+3080';

const ozonBot = new OzonBot(
    process.env.BOT_KEY as string,
    new BotSubscribersCachedCollection('./.cache/cache.json'),
    new OzonScraper(OZON_SEARCH_RESULTS_URL),
);

const main = async () => {
    await ozonBot.launch(1800000);
};

main();
