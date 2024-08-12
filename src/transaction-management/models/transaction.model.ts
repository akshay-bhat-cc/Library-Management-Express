export interface ITransactionBase {
  dueDays: number;
  memberId: number;
  bookId: number;
}

export interface ITransaction extends ITransactionBase {
  id: number;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: TransactionStatus;
}

type TransactionStatus = "Issued" | "Returned";
