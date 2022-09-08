export class ScraptedItem {
  readonly name: String;
  readonly price: number;
  readonly url: String;

  constructor(name: String, price: number, url: String) {
    this.name = name;
    this.price = price;
    this.url = url;
  }

  getPrice(): String {
    return `${this.price} ₽`;
  }
}
