
import * as fs from 'fs';
import * as path from 'path';

export class BotSubscribersCachedCollection {
    constructor(
        private readonly path: string,
    ) {
        this.initCache();
    }

    private initCache(): void {
        const directory = path.dirname(this.path);

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
            this.update([]);
        }
    }

    getChatIds(): string[] {
        const file = fs.readFileSync(this.path, 'utf8');
        return JSON.parse(file) as string[];
    }

    removeChatId(id: string): void {
        const chatIds = this.getChatIds();
        this.update(chatIds.filter((item) => item !== id));
    }

    addChatId(id: string): void {
        this.update([
            ...this.getChatIds(),
            id,
        ]);
    }

    private update(cache: string[]): void {
        fs.writeFileSync(this.path, JSON.stringify(cache), {
            encoding: 'utf8',
        });
    }
}
