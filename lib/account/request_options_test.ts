import { assert, assertEquals, assertRejects } from "@std/assert";
import type { RequestOptions } from "$http";
import { stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getAirAlerts } from "./air-alerts.ts";
import { changePassword } from "./change-password.ts";
import { createUser } from "./create.ts";
import { deleteUser } from "./delete.ts";
import { getUserDetails } from "./details.ts";
import { login } from "./login.ts";
import { passwordResetRequest, resetPassword } from "./password-reset.ts";
import { sendPhoneVerification, verifyPhone } from "./phone.ts";
import { getSubscriptions, subscribe, unsubscribe } from "./subscriptions.ts";
import { updateUser } from "./update.ts";

type Call = (options?: RequestOptions) => Promise<unknown>;

/** Rows for every function that takes a token; `t` is the token (or omitted). */
const authRows: Array<[string, (t?: string) => Promise<unknown>]> = [
  ["getAirAlerts", (t) => getAirAlerts(t)],
  ["getUserDetails", (t) => getUserDetails(t)],
  ["deleteUser", (t) => deleteUser("pw", t)],
  ["sendPhoneVerification", (t) => sendPhoneVerification(t)],
  ["verifyPhone", (t) => verifyPhone("123", t)],
  ["getSubscriptions", (t) => getSubscriptions(t)],
  ["subscribe", (t) => subscribe({ monitorId: "m", apiToken: t, level: "x" })],
  [
    "unsubscribe",
    (t) => unsubscribe({ monitorId: "m", apiToken: t, level: "x" }),
  ],
  ["updateUser", (t) => updateUser({ api_token: t, email: "a@b.c" })],
  [
    "changePassword",
    (t) =>
      changePassword({
        old_password: "a",
        new_password1: "b",
        new_password2: "b",
        api_token: t,
      }),
  ],
];

async function authorizationHeader(
  call: (t?: string) => Promise<unknown>,
  token?: string,
): Promise<string | null> {
  const stub = stubFetch();
  try {
    await call(token).catch(() => {});
    assertEquals(stub.calls.length, 1);
    return new Headers(stub.calls[0].init.headers).get("authorization");
  } finally {
    stub.restore();
  }
}

for (const [name, call] of authRows) {
  Deno.test(`auth: token sends Authorization: ${name}`, async () => {
    assertEquals(await authorizationHeader(call, "t"), "Token t");
  });
  Deno.test(`auth: no token sends no Authorization: ${name}`, async () => {
    assertEquals(await authorizationHeader(call), null);
  });
  Deno.test(`auth: empty token sends no Authorization: ${name}`, async () => {
    assertEquals(await authorizationHeader(call, ""), null);
  });
}

Deno.test("auth: existing headers kept", async () => {
  const stub = stubFetch();
  try {
    await subscribe({ monitorId: "m", apiToken: "", level: "x" });
    const headers = new Headers(stub.calls[0].init.headers);
    assertEquals(headers.get("content-type"), "application/json");
    assertEquals(headers.get("accept"), "application/json");
    assertEquals(headers.get("authorization"), null);
  } finally {
    stub.restore();
  }
});

const rows: Array<[string, Call]> = [
  ["getAirAlerts", (o) => getAirAlerts("t", o)],
  ["getUserDetails", (o) => getUserDetails("t", o)],
  ["deleteUser", (o) => deleteUser("pw", "t", o)],
  ["sendPhoneVerification", (o) => sendPhoneVerification("t", o)],
  ["verifyPhone", (o) => verifyPhone("123", "t", o)],
  ["getSubscriptions", (o) => getSubscriptions("t", o)],
  [
    "subscribe",
    (o) => subscribe({ monitorId: "m", apiToken: "t", level: "x" }, o),
  ],
  [
    "unsubscribe",
    (o) => unsubscribe({ monitorId: "m", apiToken: "t", level: "x" }, o),
  ],
  ["updateUser", (o) => updateUser({ api_token: "t", email: "a@b.c" }, o)],
  [
    "changePassword",
    (o) =>
      changePassword({
        old_password: "a",
        new_password1: "b",
        new_password2: "b",
        api_token: "t",
      }, o),
  ],
  ["login", (o) => login("id", "pw", o)],
  [
    "createUser",
    (o) => createUser({ full_name: "n", phone: "1", password: "p" }, o),
  ],
  ["passwordResetRequest", (o) => passwordResetRequest("1", o)],
  [
    "resetPassword",
    (o) =>
      resetPassword({
        code: "1",
        uidb64: "u",
        token: "t",
        new_password1: "a",
        new_password2: "a",
      }, o),
  ],
];

for (const [name, call] of rows) {
  Deno.test(`forwards signal: ${name}`, async () => {
    const stub = stubFetch();
    try {
      const controller = new AbortController();
      controller.abort();
      const error = await assertRejects(() =>
        call({ signal: controller.signal })
      );
      assertEquals((error as Error).name, "AbortError");
      assert(stub.calls.length >= 1);
    } finally {
      stub.restore();
    }
  });
}
