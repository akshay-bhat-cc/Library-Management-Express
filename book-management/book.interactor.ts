import { ZodError } from "zod";
import { NumberParser, readLine, StringParser } from "../core/input.utils";
import { IInteractor } from "../core/interactor";
import { Menu } from "../core/menu";
import { BookRepository } from "./book.repository";
import { IBook, IBookBase, bookSchema } from "./models/books.model";
import chalk from "chalk";
import { LibraryInteractor } from "../src/library.interactor";
import { viewCompleteList } from "../core/pagination";
import { LibraryDB } from "../db/library-db";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";

export class BookInteractor implements IInteractor {
  menu = new Menu("Book-Management", [
    { key: "1", label: "Add Book" },
    { key: "2", label: "Edit Book" },
    { key: "3", label: "Search Book" },
    { key: "4", label: "List Books" },
    { key: "5", label: "Delete Book" },
    { key: "6", label: chalk.yellow("<Previous Menu>") },
  ]);

  constructor(
    public libraryInteractor: LibraryInteractor,
    private readonly poolConnectionFactory: MySqlConnectionFactory
  ) {}

  private repo = new BookRepository(this.poolConnectionFactory);

  async showMenu(): Promise<void> {
    while (true) {
      const op = await this.menu.show();
      if (op) {
        switch (op.key.toLowerCase()) {
          case "1":
            await addBook(this.repo);
            break;
          case "2":
            await updateBook(this.repo);
            break;
          case "3":
            await searchBook(this.repo);
            break;
          case "4":
            await listOfBooks(this.repo);
            break;
          case "5":
            await deleteBook(this.repo);
            break;
          case "6":
            return;
          default:
            console.log(
              chalk.bold.red("\nInvalid option, Please Enter valid option\n")
            );
            break;
        }
      }
    }
  }
}

async function getBookInput(book?: IBook) {
  try {
    const title =
      (await readLine(
        `Please Enter the Title: ${book ? `(${book.title})` : ""} : `,
        StringParser(true, !!book)
      )) || book?.title;
    const author =
      (await readLine(
        `Please Enter the Author: ${book ? `(${book.author})` : ""}`,
        StringParser(true, !!book)
      )) || book?.author;
    const publisher =
      (await readLine(
        `Please Enter the Publisher: ${book ? `(${book.publisher})` : ""}`,
        StringParser(true, !!book)
      )) || book?.publisher;
    const genre =
      (await readLine(
        `Please Enter the Genre: ${book ? `(${book.genre})` : ""}`,
        StringParser(true, !!book)
      )) || book?.genre;
    const isbnNo =
      (await readLine(
        `Please Enter the ISBN: ${book ? `(${book.isbnNo})` : ""}`,
        StringParser(true, !!book)
      )) || book?.isbnNo;
    const pages =
      (await readLine(
        `Please Enter the Number of Pages: ${book ? `(${book.pages})` : ""}`,
        NumberParser(!!book)
      )) || book?.pages;
    let totalCopies = book?.totalCopies;
    if (!totalCopies) {
      totalCopies = (await readLine(
        `Please Enter the Total Number of Copies: `,
        NumberParser()
      ))!;
    }
    return {
      title: title!,
      author: author!,
      publisher: publisher!,
      genre: genre!,
      isbnNo: isbnNo!,
      pages: pages!,
      totalCopies: totalCopies!,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        chalk.bold.red("\nError while getting member input:\n"),
        error.message
      );
    }
  }
}

async function addBook(repo: BookRepository) {
  while (true) {
    try {
      const book: IBookBase | undefined = await getBookInput();
      const validatedBook = bookSchema.parse(book);
      const createdBook = await repo.create(validatedBook);
      chalk.green(
        console.log(`Book added successfully!\nBook ID: ${createdBook?.id}`)
      );
      console.table(createdBook);
      break;
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(chalk.red("\nData is invalid! Please enter valid data"));
        const errors = error.flatten().fieldErrors;
        Object.entries(errors).forEach(([field, errorMessage]) => {
          console.log(`${field}: ${chalk.red(errorMessage)}`);
        });
      } else if (error instanceof Error) {
        console.error(
          chalk.bold.red("\nError while adding the book:\n"),
          error.message
        );
      }
    }
  }
}

async function updateBook(repo: BookRepository) {
  while (true) {
    try {
      const bookId = await readLine(
        "Please Enter the Book ID: ",
        NumberParser()
      );
      const currentBook: IBook | undefined = await repo.getById(bookId!);
      console.log(currentBook);
      if (!currentBook) {
        console.log(
          chalk.bold.red("\nNo Book found! Please Enter a valid Book ID.\n")
        );
        continue;
      }
      const book: IBookBase | undefined = await getBookInput(currentBook);
      const updatedBook = await repo.update(bookId!, book!);
      console.table(updatedBook);
      break;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          chalk.bold.red("\nError while updating the book:\n"),
          error.message
        );
      }
    }
  }
}

async function searchBook(repo: BookRepository): Promise<IBook | null> {
  while (true) {
    try {
      const id = await readLine("Please Enter the Book ID: ", NumberParser());
      const book = await repo.getById(id!);
      if (!book) {
        console.log(
          chalk.bold.red("\nNo Book found! Please Enter a valid Book ID.\n")
        );
        continue;
      }
      console.table(book);
      return book;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          chalk.bold.red("\nError while searching the book:\n"),
          (error as Error).message
        );
      }
    }
  }
}

async function deleteBook(repo: BookRepository) {
  try {
    const id = await readLine("Please Enter the Book ID: ", NumberParser());
    const book = await repo.getById(id!);
    if (!book) {
      console.log(
        chalk.bold.red("\nNo Book found! Please Enter a valid Book ID.\n")
      );
    } else {
      const deletedBook = await repo.delete(id!);
      console.table(deletedBook);
      console.log(
        chalk.bold.green(`Book with ID ${id} deleted successfully\n`)
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        chalk.bold.red("\nError while deleting the book:\n"),
        (error as Error).message
      );
    }
  }
}

async function listOfBooks(repo: BookRepository) {
  try {
    const search = await readLine(
      "\nPlease Enter the Search Text (You can search by title or ISBN number):",
      StringParser(true, true)
    );
    const offset =
      (await readLine(
        "Please enter the search offset value (this determines where to start the search from, e.g., 1 for the beginning):",
        NumberParser(true)
      )) || 0;
    const limit =
      (await readLine(
        "Please enter the search limit value (this determines the number of results to return):",
        NumberParser(true)
      )) || 10;

    const totalBooks = await repo.getTotalCount();
    await viewCompleteList<IBookBase, IBook>(
      repo,
      offset,
      limit,
      totalBooks!,
      search
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        chalk.bold.red("\nError while listing books:\n"),
        (error as Error).message
      );
    }
  }
}
