
import * as fs from 'fs';
import * as path from 'path';

export class BotSubscribersCachedSet {
    private readonly _subscribers: Set<string>;

    constructor(
        private readonly _path: string,
    ) {
        const directory = path.dirname(this._path);

        !fs.existsSync(directory) && fs.mkdirSync(directory);
        !fs.existsSync(this._path) && fs.writeFileSync(this._path, '[]', { encoding: 'utf8' });

        const file = fs.readFileSync(this._path, 'utf8');
        this._subscribers = new Set(JSON.parse(file) as string[]);
    }

    getChatIds(): string[] {
        return [...this._subscribers];
    }

    remove(id: string): void {
        this._subscribers.delete(id);
        this.save();
    }

    add(id: string): void {
        this._subscribers.add(id);
        this.save();
    }

    private save(): void {
        fs.writeFileSync(this._path, JSON.stringify(this.getChatIds()), {
            encoding: 'utf8',
        });
    }
}
