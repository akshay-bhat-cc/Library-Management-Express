import { LibraryInteractor } from "./library.interactor";
import { getDB } from "./db/drizzle/drizzleDb";
import { HTTPServer } from "./server/server";

const db = getDB();
const libraryInteractor = new LibraryInteractor(db);
(async () => {
  await libraryInteractor.showMenu();
})();
