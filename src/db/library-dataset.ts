import { IBook } from "../book-management/models/books.model";
import { IMember } from "../member-management/models/member.model";
import { ITransaction } from "../transaction-management/models/transaction.model";

export interface LibraryDataset {
  books: IBook;
  members: IMember;
  transactions: ITransaction;
}
