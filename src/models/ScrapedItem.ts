export class ScrapedItem {
    readonly name: string;
    readonly price: number;
    readonly url: string;

    constructor(name: string, price: number, url: string) {
        this.name = name;
        this.price = price;
        this.url = url;
    }

    getPrice(): string {
        return `${this.price} ₽`;
    }

    toMessage(): string {
        return `${this.getPrice()} <a href="${this.url}">${this.name}</a>`;
    }
}
