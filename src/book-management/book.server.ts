import { HTTPServer, Middleware } from "../server/server"; // Assuming the class is saved in HTTPServer.ts
import { getDB } from "../db/drizzle/drizzleDb";
import { BookRepository } from "./book.repository";
import { bookSchema, IBook, IBookUpdate } from "./models/books.model";
import { ZodError } from "zod";
import AppError, { StatusCode } from "../server/appError";

const db = getDB();
const bookRepository = new BookRepository(db);
const server = new HTTPServer(3000);

// Global middleware to set headers
server.use((request, response, next) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  if (next) next();
});

server.use("/library", (request, response, next) => {
  console.log("Inside library");
  next?.();
});

server.use(
  "/library/transaction",
  (request, response, next) => {
    console.log("Inside transaction1");
    next?.();
  },
  (request, response, next) => {
    console.log("Inside transaction2");
    next?.();
  }
);

server.get("/library/transaction", (request, response, next) => {
  console.log("Inside Get Transaction");
  response.end("Transaction completed");
});

// Middleware to parse request body for POST, PUT, PATCH methods
const parseRequestBody: Middleware = async (request, response, next) => {
  request.body = new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      if (body) {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          next?.(new AppError(400, error as Error));
        }
      } else {
        next?.(new Error());
      }
    });
    request.on("error", (err) => {
      next?.(new AppError(StatusCode.VALIDATION_ERROR, new Error(err.message)));
      return;
    });
  });
  if (next) next();
};

// Middleware to add searchParams to the request object
server.use((request, response, next) => {
  const url = new URL(request.url ?? "", `http://${request.headers.host}`);
  request.searchParams = url.searchParams;
  if (next) next();
});

/**
 * Get book by ID
 * GET /library/book
 */
server.get("/library/book", async (request, response) => {
  const bookId = Number(request.searchParams?.get("id"));
  if (isNaN(bookId)) {
    response
      .writeHead(StatusCode.VALIDATION_ERROR, { "Content-Type": "text/plain" })
      .end("Invalid book ID, Book ID must be a number");
    return;
  }
  try {
    const book = await bookRepository.getById(bookId);
    const validatedBook = bookSchema.parse(book);
    if (validatedBook) {
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(validatedBook));
    } else {
      response
        .writeHead(404, { "Content-Type": "text/plain" })
        .end("Book not found");
    }
  } catch (error) {
    response
      .writeHead(500, { "Content-Type": "text/plain" })
      .end("Internal Server Error");
  }
});

/**
 * List of books
 * GET /library/books
 */
server.get("/library/books", async (request, response) => {
  try {
    const page = Number(request.searchParams?.get("page")) || 1;
    const limit = Number(request.searchParams?.get("limit")) || 10;
    const search = request.searchParams?.get("search") || "";

    const offset = (page - 1) * limit;
    const booksList = await bookRepository.list({ limit, offset, search });
    const totalCount = await bookRepository.getTotalCount();

    const responseData = {
      totalBooks: totalCount,
      currentPage: page,
      limit: booksList?.pagination.limit,
      books: booksList?.items,
    };

    response
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(responseData));
  } catch (error) {
    console.log(error);
    response
      .writeHead(500, { "Content-Type": "text/plain" })
      .end("Internal Server Error");
  }
});

/**
 * Create Book
 * POST /library/books
 */

const validateBook: Middleware = async (request, response, next) => {
  try {
    const book = await request.body;
    bookSchema.parse(book);
    request.body = book;
    next?.();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors;
      const errorInfo: Record<string, string> = {};
      Object.entries(errors).forEach(([field, errorMessage]) => {
        errorInfo[field] = errorMessage?.toString() ?? "unknown error";
      });
      next?.(
        new AppError(
          StatusCode.VALIDATION_ERROR,
          new Error(JSON.stringify(errorInfo))
        )
      );
    }
  }
};

const createBook: Middleware = async (request, response, next) => {
  const book = request.body as IBook;
  try {
    const createdBook = (await bookRepository.create(book)) as IBook;
    response.writeHead(201, { "Content-Type": "application/json" }).end(
      JSON.stringify({
        message: `Book inserted successfully, ID: ${createdBook.id}`,
      })
    );
  } catch (error) {
    if ((error as Error).message.includes("Duplicate")) {
      next?.(
        new AppError(
          500,
          new Error(
            `Duplicate entry for the book with ISBN ${book.isbnNo} already exists`
          )
        )
      );
    } else {
      next?.(
        new AppError(
          StatusCode.SERVER_ERROR,
          new Error(`Internal Server Error`)
        )
      );
    }
  }
};
server.post("/library/books", parseRequestBody, validateBook, createBook);

/**
 * Update Book
 * PATCH /library/books/:id
 */

const validateQueryParam: Middleware = (request, response, next) => {
  const bookId = request.searchParams?.get("id");
  if (!bookId) {
    next?.(
      new AppError(
        StatusCode.VALIDATION_ERROR,
        new Error("ID is Missing in the Query Parameter")
      )
    );
    return;
  }
  request.bookId = bookId;
  next?.();
};

const checkRequiredFields = (book: IBookUpdate): boolean => {
  const requiredFields: (keyof IBookUpdate)[] = [
    "title",
    "author",
    "publisher",
    "genre",
    "isbnNo",
    "pages",
  ];
  let isValid = true;
  requiredFields.forEach((field) => {
    if (!(field in book)) {
      isValid = false;
    }
  });

  return isValid;
};

const validateUpdateBookData: Middleware = async (request, response, next) => {
  const book = await request.body;
  if (checkRequiredFields(book)) {
    request.body = book;
    next?.();
  } else {
    const error = new AppError(
      StatusCode.VALIDATION_ERROR,
      new Error("Some required fields are missing")
    );
    next?.(error);
  }
};

const updateBook: Middleware = async (request, response) => {
  try {
    const bookId = request.bookId;
    const book = await request.body;
    const updatedBook = await bookRepository.update(bookId, book);
    if (updatedBook) {
      response
        .writeHead(200, { "Content-Type": "text/plain" })
        .end(`Book updated successfully, ID: ${bookId}`);
    } else {
      response
        .writeHead(404, { "Content-Type": "text/plain" })
        .end("Book not found");
    }
  } catch (error) {
    response
      .writeHead(500, { "Content-Type": "text/plain" })
      .end("Internal Server Error");
  }
};
server.patch(
  "/library/books",
  validateQueryParam,
  parseRequestBody,
  validateUpdateBookData,
  updateBook
);

/**
 * Delete book by ID
 * DELETE /library/book
 */
server.delete("/library/book", async (request, response) => {
  const bookId = Number(request.searchParams?.get("id"));
  if (isNaN(bookId)) {
    response
      .writeHead(400, { "Content-Type": "text/plain" })
      .end("Invalid book ID, Book ID must be a number");
    return;
  }
  try {
    const book = await bookRepository.delete(bookId);
    if (book) {
      response
        .writeHead(200, { "Content-Type": "application/json" })
        .end(JSON.stringify(book));
    } else {
      response
        .writeHead(404, { "Content-Type": "text/plain" })
        .end("Book not found");
    }
  } catch (error) {
    console.log(error);
    response
      .writeHead(500, { "Content-Type": "text/plain" })
      .end("Internal Server Error");
  }
});
