import { describe, test, expect } from "vitest";
import { formatDate } from "./formatdate";

describe("formatDate", () => {
  test("formats the date correctly", () => {
    const date = new Date("2024-07-07T15:30:00Z"); // ISO string in UTC
    const formattedDate = formatDate(date);

    expect(formattedDate).toBe("Sunday, 2024-07-07, 15:30:00");
  });

  test("formats different dates correctly", () => {
    const date1 = new Date("2022-01-01T10:00:00Z");
    const formattedDate1 = formatDate(date1);
    expect(formattedDate1).toBe("Saturday, 2022-01-01, 10:00:00");

    const date2 = new Date("2023-12-25T00:00:00Z");
    const formattedDate2 = formatDate(date2);
    expect(formattedDate2).toBe("Monday, 2023-12-25, 00:00:00");

    const date3 = new Date("2024-02-29T23:59:59Z");
    const formattedDate3 = formatDate(date3);
    expect(formattedDate3).toBe("Thursday, 2024-02-29, 23:59:59");
  });

  test("handles time zones correctly", () => {
    const date = new Date("2024-07-07T13:30:00+02:00"); // Date with timezone offset
    const formattedDate = formatDate(date);

    // Expected time in UTC
    expect(formattedDate).toBe("Sunday, 2024-07-07, 11:30:00"); // Adjusted to UTC time
  });

  test("handles edge cases", () => {
    const date = new Date("1970-01-01T00:00:00Z");
    const formattedDate = formatDate(date);
    expect(formattedDate).toBe("Thursday, 1970-01-01, 00:00:00");

    const futureDate = new Date("2100-12-31T23:59:59Z");
    const formattedFutureDate = formatDate(futureDate);
    expect(formattedFutureDate).toBe("Friday, 2100-12-31, 23:59:59");
  });
});
