import { BookInteractor } from "../book-management/book.interactor";
import { IInteractor } from "../core/interactor";
import { Menu } from "../core/menu";
import { MemberInteractor } from "../member-management/member.interactor";
import { TransactionInteractor } from "../transaction-management/transaction.interactor";
import chalk from "chalk";
import { DBConfig } from "../db/mysqldb";
import { LibraryDB } from "../db/library-db";
import { AppEnvs } from "../read-env";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";

export class LibraryInteractor implements IInteractor {
  menu = new Menu("Library-Management", [
    { key: "1", label: "Book Management" },
    { key: "2", label: "Member Management" },
    { key: "3", label: "Transaction" },
    { key: "4", label: "Exit" },
  ]);
  // TODO should we create DBconfig in the Interactor and pass this as argument or initialize within the Librarydb as a memmber
  private readonly config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };
  poolConnectionFactory = new MySqlConnectionFactory(this.config);

  constructor() {}
  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await this.menu.show();
      if (op) {
        switch (op?.key.toLocaleLowerCase()) {
          case "1":
            const bookInteractor = new BookInteractor(
              this,
              this.poolConnectionFactory
            );
            await bookInteractor.showMenu();
            break;
          case "2":
            const memberInteractor = new MemberInteractor(
              this,
              this.poolConnectionFactory
            );
            await memberInteractor.showMenu();
            break;

          case "3":
            const transactionInteractor = new TransactionInteractor(
              this,
              this.poolConnectionFactory
            );
            await transactionInteractor.showMenu();
            break;

          case "4":
            process.exit(0);
            break;
        }
      } else {
        console.log(
          chalk.bold.red("\nInvalid option, Please Enter valid option\n")
        );
      }
    }
  }
}
