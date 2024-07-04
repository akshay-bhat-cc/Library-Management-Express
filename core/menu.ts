import { readChar } from "./input.utils";

export interface IMenuItem {
  key: string;
  label: string;
}
export class Menu {
  constructor(
    private readonly title: string,
    private readonly items: IMenuItem[]
  ) {}
  serialize(): string {
    let str = this.items.reduce((str, item) => {
      if (str) {
        str += "\n\t";
      }
      str += `${item.key}.\t${item.label}`;
      return str;
    }, `${this.title}`);

    str += "\n\nChoice- ";
    return str;
  }
  getItem(key: string) {
    return this.items.find((i) => i.key === key) || null;
  }

  async show() {
    const op = await readChar(this.serialize());
    const menuItem = this.getItem(op);
    if (menuItem) {
      console.log(`${menuItem.key}\t${menuItem.label}`);
      console.log("\n");
    } else {
      console.log(op);
    }
    return menuItem;
  }
}
