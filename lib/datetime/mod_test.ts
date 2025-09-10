import { assertEquals } from "@std/assert";
import { apiDateFormat } from "./api-date-format.ts";

Deno.test(
  "Module: API Date Format",
  async (t) => {
    await t.step(
      "API Date Format",
      async (t2) => {
        const expectedResult = "2024-03-17 08:15:24";

        await t2.step("From Date object", () => {
          const date: Date = new Date("03/17/2024 08:15:24");

          assertEquals(apiDateFormat(date), expectedResult);
        });

        await t2.step("From number", () => {
          const date: number = new Date(expectedResult).getTime();

          assertEquals(apiDateFormat(date), expectedResult);
        });

        await t2.step("From string", () => {
          const date: string = "03/17/2024 08:15:24";

          assertEquals(apiDateFormat(date), expectedResult);
        });
      },
    );
  },
);
