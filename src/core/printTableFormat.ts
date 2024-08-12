import chalk from "chalk";

export function printTableWithoutIndex<T>(data: T[]): void {
  const maxLengths: { [key: string]: number } = {};
  data.forEach((item: T) => {
    Object.keys(item as string).forEach((key) => {
      if (key) {
        const keyLength = String(key).length;
        const valueLength = String(item[key as keyof T]).length;
        const lengthToBePrinted = Math.max(keyLength, valueLength) + 2;
        if (!maxLengths[key] || lengthToBePrinted > maxLengths[key]) {
          maxLengths[key] = lengthToBePrinted;
        }
      }
    });
  });

  const headers = Object.keys(maxLengths);
  const divider = headers
    .map((header) => "-".repeat(maxLengths[header]))
    .join(" - ");

  console.log(chalk.bold.blue(divider));

  console.log(
    headers
      .map((header) =>
        chalk.bold.yellow(header.toUpperCase().padEnd(maxLengths[header]))
      )
      .join(chalk.bold.blue("|"))
  );

  console.log(chalk.bold.blue(divider));

  function printRow(item: T): void {
    console.log(
      headers
        .map((header) =>
          String(" " + item[header as keyof T]).padEnd(maxLengths[header])
        )
        .join(chalk.bold.blue("|"))
    );
  }

  data.forEach((item) => {
    printRow(item);
  });
  console.log(chalk.bold.blue(divider));
}
