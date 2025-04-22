import { assertEquals } from "@std/assert";
import { apiRequest, getApiV1Url, origin, setOrigin } from "./mod.ts";

function removeSeconds(date: Date) {
  date.setMilliseconds(0);
  date.setSeconds(0);
}

Deno.test({
  name: "Module: HTTP Client",
  permissions: { net: true },
  async fn(t) {
    await t.step("Change origin", () => {
      const originalOrigin = origin;
      const newOrigin = "http://localhost";
      setOrigin(newOrigin);

      assertEquals(origin, newOrigin);

      // reset origin for the rest of the tests
      setOrigin(originalOrigin);
    });

    const buildApiUrlSuccess = await t.step("Build API URL object", () => {
      const url = getApiV1Url("monitors/closest", {
        latitude: "36.76272050981146",
        longitude: "-119.7987626619462",
      });

      assertEquals(
        url.href,
        "https://www.sjvair.com/api/1.0/monitors/closest/?latitude=36.76272050981146&longitude=-119.7987626619462",
      );
    });

    await t.step({
      name: "API Request",
      ignore: !buildApiUrlSuccess,
      async fn() {
        const requestUrl = getApiV1Url("time");
        const { body: result } = await apiRequest<number>(requestUrl);

        const resultDate = removeSeconds(new Date(result * 1000));
        const comparisonDate = removeSeconds(new Date());

        assertEquals(
          resultDate,
          comparisonDate,
        );
      },
    });
  },
});
