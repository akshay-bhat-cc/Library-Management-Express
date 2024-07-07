import { IInteractor } from "../core/interactor";
import { Database } from "../db/ds";
import { LibraryDataset } from "../db/library-dataset";
import { LibraryInteractor } from "../src/library.interactor";
import { TransactionRepository } from "./transaction.repository";
import {
  NumberParser,
  StringParser,
  readChar,
  readLine,
} from "../core/input.utils";
import { ITransaction, ITransactionBase } from "./models/transaction.model";
import { Menu } from "../core/menu";
import { MemberRepository } from "../member-management/member.repository";
import { BookRepository } from "../book-management/book.repository";
import chalk from "chalk";
import { viewCompleteList } from "../core/pagination";
import { EOL } from "os";

export class TransactionInteractor implements IInteractor {
  menu = new Menu("\nTransaction-Management", [
    { key: "1", label: "Issue Book" },
    { key: "2", label: "Return Book " },
    { key: "3", label: "Search Transaction" },
    { key: "4", label: "List Transaction" },
    { key: "5", label: "<Previous Transaction>" },
  ]);
  constructor(
    public libraryInteractor: LibraryInteractor,
    private readonly db: Database<LibraryDataset>
  ) {}
  bookRepo = new BookRepository(this.db);
  memberRepo = new MemberRepository(this.db);
  private repo = new TransactionRepository(this.db);
  async showMenu(): Promise<void> {
    while (true) {
      const op = await this.menu.show();
      if (op) {
        switch (op?.key.toLocaleLowerCase()) {
          case "1":
            await issueBook(this.repo, this.bookRepo, this.memberRepo);
            break;
          case "2":
            await returnBook(this.repo);
            break;
          case "3":
            await searchTransaction(this.repo);
            break;
          case "4":
            await listTransaction(this.repo);
            break;
          case "5":
            await this.libraryInteractor.showMenu();
          default:
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

async function issueBook(
  repo: TransactionRepository,
  bookRepo: BookRepository,
  memberRepo: MemberRepository
) {
  const transaction: ITransactionBase = await getTransactionInput(
    bookRepo,
    memberRepo
  );
  const transactionRecord: ITransaction = await repo.create(transaction);
  const createdTransaction = await repo.update(transactionRecord.id);
  if (!createdTransaction) {
    console.log(chalk.bold.red("Error while Creating the transaction"));
    return;
  }
  console.log(`Book issued successfully!\nBook ID:${createdTransaction.id}`);
  console.table(createdTransaction);
}

async function returnBook(repo: TransactionRepository) {
  while (true) {
    const transactionId = (await readLine(
      `Please Enter the Transaction Id :`,
      NumberParser(true)
    )) as number;
    const transaction = await repo.getById(transactionId);
    if (transaction) {
      if (transaction.Status === "Issued") {
        transaction.Status = "Returned";
        repo.update(transaction!.id);
        console.log(
          chalk.green(`Book returned successfully!\nBook ID:${transaction?.id}`)
        );
        break;
      } else {
        console.log(chalk.red("Books is already returned.\n"));
      }
    } else {
      console.log(chalk.red("No transactions found for the given ID.\n"));
    }
  }
}

async function readConfirmation(message: string): Promise<boolean> {
  while (true) {
    const input = (await readChar(message))
      .toString()
      .replace(/\r?\n|\r/g, "")
      .toLowerCase()
      .trim();
    if (input === "y" || input === "") {
      return true;
    } else if (input === "n") {
      return false;
    } else {
      console.log(
        chalk.red("Invalid input. Please enter 'Y' or Simply Press Enter'↩'.")
      );
    }
  }
}

async function getTransactionInput(
  bookRepo: BookRepository,
  memberRepo: MemberRepository
) {
  let bookId: number | null;
  let memberId: number | null;
  while (true) {
    bookId = await readLine(`Please Enter the BookId : `, NumberParser(true));
    const book = await bookRepo.getById(bookId!);
    if (book && bookId) {
      console.table(book);
      if (book.availableNumberOfCopies === 0) {
        console.log(
          chalk.yellow(
            "Sorry, this book is currently out of stock. Please select another book.\n"
          )
        );
        continue;
      }
      const status = await readConfirmation(
        `If the Book is correct then enter ${chalk.bold.yellow("Y/y or Enter ↩ ")}, else ${chalk.bold.yellow(" (N/n) ")}to re-enter the Book ID: \n`
      );
      if (status) {
        console.log(
          chalk.green(
            `\nYour confirmed Book is ${chalk.bold.white(book.title)}\n`
          )
        );
        break;
      } else {
        console.log(chalk.red("\nInvalid Book ID. Please try again.\n"));
      }
    } else {
      console.log(chalk.red("\nInvalid Member ID. Please try again.\n"));
    }
  }

  while (true) {
    memberId = await readLine(
      `\nPlease Enter the Member Id :`,
      NumberParser(true)
    );
    if (memberId && (await memberRepo.getById(memberId))) {
      break;
    } else {
      console.log(chalk.red("Invalid Member ID. Please try again."));
    }
  }
  return {
    bookId: bookId!,
    memberId: memberId!,
  };
}

async function searchTransaction(
  repo: TransactionRepository
): Promise<ITransaction | null> {
  while (true) {
    const id = await readLine(
      "Please Enter the Transaction Id:",
      NumberParser()
    );
    const transaction = await repo.getById(id!);
    if (!transaction) {
      console.log(
        chalk.bold.red("\nNo Member found!!  Please Enter Valid Member ID!!!\n")
      );
      continue;
    } else {
      console.table(transaction);
      return transaction;
    }
  }
}

async function listTransaction(repo: TransactionRepository) {
  const search = await readLine(
    "\nPlease enter your search  (Member ID or Book ID):\n",
    StringParser(true, true)
  );
  const offset =
    (await readLine(
      "Please enter the search offset value (e.g., 0 to start from the beginning):\n",
      NumberParser(true)
    )) || 0;
  const limit =
    (await readLine(
      "\nPlease enter the search limit value (the number of results to return):\n",
      NumberParser(true)
    )) || 10;

  const totalTransaction = repo.getTotalCount();
  await viewCompleteList<ITransactionBase, ITransaction>(
    repo,
    offset,
    limit,
    totalTransaction,
    search
  );
}
