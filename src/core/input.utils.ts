import chalk from "chalk";
import { EOL } from "node:os";
import { emitKeypressEvents } from "node:readline";
export const readChar = (question: string): Promise<string> => {
  process.stdin.write(question);
  return new Promise((resolve) => {
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    const onData = async (key: Buffer) => {
      const char = key.toString("utf-8");
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", onData);
      if (char.charCodeAt(0) === 3) {
        process.exit(0);
      }
      resolve(char);
    };
    process.stdin.addListener("data", onData);
  });
};

export function readLine<T>(
  question: string,
  parser: (rawInput: string) => T
): Promise<T> {
  return new Promise((resolve) => {
    process.stdout.write(question);

    const resolveValue = (value: T) => {
      process.stdin.removeListener("data", onData);
      resolve(value);
    };

    const onData = async (key: Buffer) => {
      let input = key.toString("utf-8");
      input = input.substring(0, input.length - EOL.length);
      let parsed: T;
      try {
        parsed = parser(input);
        resolveValue(parsed);
      } catch (err) {
        const error: Error = err as Error;
        process.stdin.write(`\n\ninvalid input : ${error.message}\n\n`);
        process.stdout.write(question);
        return;
      }
    };
    process.stdin.addListener("data", onData);
  });
}

export function StringParser(
  trimmed: boolean = true,
  optional?: boolean,
  isNull?: true
) {
  return (rawInput: string) => {
    if (trimmed) {
      rawInput = rawInput.trim();
    }
    if (optional === undefined) {
      optional = false;
    }
    if (isNull) {
      return null;
    }
    if (optional && rawInput.length === 0) {
      return null;
    }
    if (rawInput.length === 0) {
      throw new Error(chalk.red("Empty values are not accepted"));
    }
    return rawInput.trim();
  };
}

export function NumberParser(optional?: boolean) {
  return (rawInput: string) => {
    if (optional === undefined) {
      optional = false;
    }
    if (optional && rawInput.trim().length === 0) {
      return null;
    }
    const num = Number(rawInput);
    if (isNaN(num) || rawInput.trim().length === 0) {
      throw new Error(chalk.red("Input must be a valid number!"));
    }
    return num;
  };
}

export function BooleanParser() {
  return (rawInput: string) => {
    rawInput = rawInput.trim().toLowerCase();
    if (["yes", "true", "1", "y"]) {
      return true;
    } else if (["no", "false", "0", "n"]) {
      return false;
    } else {
      throw new Error(chalk.red("Input must be a valid boolean!"));
    }
  };
}
