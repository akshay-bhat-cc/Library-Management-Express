import { TransactionRepository } from "./transaction.repository";
import { describe, expect, test, beforeAll } from "vitest";
import { LibraryDataset } from "../db/library-dataset";
import { Database } from "../db/ds";
import { faker } from "@faker-js/faker";
import { ITransaction, ITransactionBase } from "./models/transaction.model";
import { IMemberBase } from "../../member-management/models/member.model";
import { rm } from "fs/promises";
import { DBConfig } from "../db/mysqldb";
import { AppEnvs } from "../../read-env";
import { MySqlConnectionFactory } from "../db/MySqlDbConnection";

describe("TransactionRepository", () => {
  const config: DBConfig = {
    dbURL: AppEnvs.DATABASE_URL,
  };

  const transactionRepository = new TransactionRepository(
    new MySqlConnectionFactory(config)
  );

  beforeEach(async () => {
    await transactionRepository.deleteAll();
    await rm("./data/mock-library.json");
  });
  afterEach(async () => {
    await transactionRepository.deleteAll();
    await rm("./data/mock-library.json");
  });

  const generateTransaction = (count: number): ITransactionBase[] => {
    return Array.from({ length: count }, () => ({
      bookId: faker.number.int({ min: 1, max: 100 }),
      memberId: faker.number.int({ min: 1, max: 100 }),
    }));
  };

  const transactions: ITransactionBase[] = generateTransaction(100);
  // Test case for create method

  test("create transaction", async () => {
    const transaction: ITransaction = await transactionRepository.create(
      transactions[0]
    );

    expect(transaction).toBeDefined();
    expect(transaction.id).toBeDefined();
    expect(transaction.dueDate).toBeDefined();
    expect(transaction.bookId).toBe(transactions[0].bookId);
    expect(transaction.memberId).toBe(transactions[0].memberId);
    expect(transaction.Status).toBe("Issued");
  });

  test("Create Many transactions", () => {
    transactions.forEach((transactionData) => {
      transactionRepository.create(transactionData);
    });
    const totalTransactions = transactionRepository.getTotalCount();
    expect(transactions.length).toBe(totalTransactions);
  });

  // Test case for getById method
  test("get transaction by id", async () => {
    const transaction: ITransaction = await transactionRepository.create(
      transactions[0]
    );
    const retrievedTransaction = await transactionRepository.getById(
      transaction.id
    );
    expect(retrievedTransaction).toEqual(transaction);
  });

  test("Update Transactions", async () => {
    const transaction: ITransaction = await transactionRepository.create(
      transactions[0]
    );
    expect(transaction.Status).toBe("Issued");
    transaction.Status = "Returned";
    const updatedTransaction = await transactionRepository.update(
      transaction.id
    );
    expect(updatedTransaction?.Status).toBe("Returned");
  });

  test("list transactions", async () => {
    const pageRequest = {
      offset: 0,
      limit: 10,
    };
    const transactionsPage = transactionRepository.list(pageRequest);
    expect(transactionsPage.items.length).toBeGreaterThanOrEqual(0); // Adjust based on your test data
    expect(transactionsPage.pagination.offset).toBe(pageRequest.offset);
    expect(transactionsPage.pagination.limit).toBe(pageRequest.limit);
  });
});
