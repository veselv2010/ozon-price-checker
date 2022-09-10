import { ILogManager } from "./ILogManager";

export class ConsoleLogManager implements ILogManager {
    private readonly redColor = '\x1b[31m';

    constructor() {
        console.log(this.formatLog('Bot started'));
    }

    e(message: string) {
        console.log(this.redColor, this.formatLog(message));
    }

    i(message: string) {
        console.log(this.formatLog(message));
    }

    private formatLog(text: string) {
        const dateTime = new Date().toLocaleString();
        return `[${dateTime}] ${text}`;
    }
}
