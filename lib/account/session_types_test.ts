import { assertEquals } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { changePassword } from "./change-password.ts";
import { getUserDetails } from "./details.ts";
import type { SessionUserDetails, UserDetails } from "./types.ts";
import { updateUser } from "./update.ts";
import type { UpdateUserForm } from "./update.ts";
import type { ChangePasswordConfig } from "./change-password.ts";

const user = {
  id: "u1",
  full_name: "Test User",
  email: "t@example.com",
  phone: "+15552221234",
  phone_verified: false,
  language: "en",
  api_token: "abc",
};

Deno.test("account calls type the response by whether a token is passed", async () => {
  const stub = stubFetch(() => jsonResponse({ data: user }));
  try {
    // Mobile app call shapes: `api_token: string`, results are UserDetails.
    const model: { api_token: string } = { api_token: "abc" };
    const a: UserDetails = await getUserDetails("t");
    const m1: UserDetails = await getUserDetails(model.api_token);
    const updateForm: Omit<UpdateUserForm, "api_token"> = { email: "a@b.c" };
    const m2: UserDetails = await updateUser({
      ...updateForm,
      api_token: model.api_token,
    });
    const pwForm: Omit<ChangePasswordConfig, "api_token"> = {
      old_password: "a",
      new_password1: "b",
      new_password2: "b",
    };
    const m3: UserDetails = await changePassword({
      ...pwForm,
      api_token: model.api_token,
    });
    assertEquals([a, m1, m2, m3].map((u) => u.api_token), [
      "abc",
      "abc",
      "abc",
      "abc",
    ]);

    // Token-free calls return SessionUserDetails, which has no api_token.
    const b: SessionUserDetails = await getUserDetails();
    // @ts-expect-error SessionUserDetails has no api_token
    b.api_token;
    const s2 = await updateUser({ email: "a@b.c" });
    // @ts-expect-error SessionUserDetails has no api_token
    s2.api_token;
    const s3 = await changePassword(pwForm);
    // @ts-expect-error SessionUserDetails has no api_token
    s3.api_token;

    // A `string | undefined` token picks the union overload.
    const maybe = Math.random() > 2 ? "t" : undefined;
    const u1: UserDetails | SessionUserDetails = await getUserDetails(maybe);
    const u2: UserDetails | SessionUserDetails = await updateUser({
      ...updateForm,
      api_token: maybe,
    });
    const u3: UserDetails | SessionUserDetails = await changePassword({
      ...pwForm,
      api_token: maybe,
    });
    assertEquals([u1, u2, u3].length, 3);
  } finally {
    stub.restore();
  }
});
