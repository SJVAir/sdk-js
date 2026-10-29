/**
 * Integration test for the documents module, against a running sjvair.com
 * that serves `/api/2.0/documents/`.
 *
 * Skipped unless `TEST_DOCUMENTS=1`. It needs:
 *
 * - `TEST_DOCUMENTS_IDENTIFIER` and `TEST_DOCUMENTS_PASSWORD`: an account on
 *   that server (phone or email, and its password). The test creates one
 *   dashboard and permanently deletes it; it sets the account's display name
 *   and puts the old one back.
 * - `TEST_DOCUMENTS_ORIGIN` (optional): the server, default
 *   `http://127.0.0.1:8000`.
 *
 * It signs in through the site's login form (`/account/login/`), as a browser
 * would, since the documents API is used with the session cookie. Outside a
 * browser the SDK sends no cookies or CSRF header itself, so every signed-in
 * call passes `Cookie` and `X-CSRFToken` through `options.init`.
 *
 * ```sh
 * TEST_DOCUMENTS=1 deno test --allow-net --allow-env --env-file lib/documents/mod_test.ts
 * ```
 *
 * @module
 */
import { assert, assertEquals, assertRejects } from "@std/assert";
import { type RequestOptions, setOrigin } from "$http";
import { getUserDetails } from "../account/details.ts";
import {
  createShareLink,
  deleteDocument,
  getDocument,
  getDocumentChanges,
  getDocumentCredit,
  getDocumentProfile,
  getSharedDocument,
  getSharedDocumentChanges,
  isDocumentRefusal,
  listDocuments,
  listSnapshots,
  type RefusalCode,
  revokeShareLink,
  saveDocument,
  type SaveDocumentForm,
  staleBaseDataSchema,
  updateDocumentProfile,
} from "./mod.ts";

const ENABLED = Deno.env.get("TEST_DOCUMENTS") === "1";
const ORIGIN = Deno.env.get("TEST_DOCUMENTS_ORIGIN") ?? "http://127.0.0.1:8000";

/** Adds a response's `Set-Cookie` values to the jar. */
function keepCookies(jar: Map<string, string>, response: Response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

/**
 * Signs in through the login form and returns request options carrying the
 * session cookie and the CSRF header.
 */
async function signIn(): Promise<RequestOptions> {
  const identifier = Deno.env.get("TEST_DOCUMENTS_IDENTIFIER");
  const password = Deno.env.get("TEST_DOCUMENTS_PASSWORD");
  if (!identifier || !password) {
    throw new Error(
      "Set TEST_DOCUMENTS_IDENTIFIER and TEST_DOCUMENTS_PASSWORD",
    );
  }

  const jar = new Map<string, string>();
  const loginUrl = `${ORIGIN}/account/login/`;
  const page = await fetch(loginUrl);
  keepCookies(jar, page);
  const html = await page.text();
  const token = html.match(
    /name=["']csrfmiddlewaretoken["'][^>]*value=["']([^"']+)["']/,
  )?.[1] ?? html.match(
    /value=["']([^"']+)["'][^>]*name=["']csrfmiddlewaretoken["']/,
  )?.[1];
  assert(token, "No csrfmiddlewaretoken on the login page");

  const response = await fetch(loginUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader(jar),
      "Referer": loginUrl,
    },
    body: new URLSearchParams({
      identifier,
      password,
      csrfmiddlewaretoken: token,
    }),
  });
  await response.body?.cancel();
  keepCookies(jar, response);
  assertEquals(response.status, 302, "Sign-in failed (check the account)");
  assert(jar.has("sessionid"), "Sign-in set no session cookie");

  return {
    init: {
      headers: {
        "Cookie": cookieHeader(jar),
        "X-CSRFToken": jar.get("csrftoken") ?? "",
        "Referer": `${ORIGIN}/`,
      },
    },
  };
}

async function assertRefused(
  call: () => Promise<unknown>,
  code: RefusalCode,
) {
  const error = await assertRejects(call);
  assert(
    isDocumentRefusal(error, code),
    `Expected ${code}, got ${String(error)}`,
  );
  return error;
}

Deno.test({
  name: "Module: Documents Endpoints",
  ignore: !ENABLED,
  permissions: { net: true, env: true },
  async fn(t) {
    setOrigin(ORIGIN);

    await t.step("signed out: listing is refused as unauthorized", async () => {
      await assertRefused(() => listDocuments(), "unauthorized");
    });

    const session = await signIn();
    const account = await getUserDetails(undefined, session);
    const id = `sdk-test-${crypto.randomUUID().slice(0, 8)}`;
    const form = (
      overrides: Partial<SaveDocumentForm>,
    ): SaveDocumentForm => ({
      kind: "dashboard",
      schema_version: 1,
      name: "SDK test",
      body: { widgets: [] },
      deleted_at: null,
      copied_from: null,
      base_version: null,
      changes: [],
      account_id: account.id,
      build_id: "sdk-js-test",
      snapshot: null,
      ...overrides,
    });

    let created = false;
    try {
      await t.step("a reserved id is refused as invalid", async () => {
        const error = await assertRefused(
          () => saveDocument("shared", form({}), session),
          "invalid",
        );
        assertEquals(error.status, 400);
      });

      const first = await saveDocument(id, form({}), session);
      created = true;

      const second = await saveDocument(
        id,
        form({
          base_version: first.version,
          body: { widgets: [1] },
          changes: [{ schema_version: 1, change: { op: "add" } }],
        }),
        session,
      );

      await t.step("create, save, and read", async () => {
        assert(second.version > first.version);
        const doc = await getDocument(id, session);
        assertEquals(doc.version, second.version);
        assertEquals(doc.body, { widgets: [1] });

        const list = await listDocuments(undefined, session);
        assert(list.documents.some((d) => d.id === id));
        const since = await listDocuments({ since: list.cursor }, session);
        assert(Array.isArray(since.purged));
      });

      await t.step("changes since a version, and unchanged", async () => {
        const changed = await getDocumentChanges(id, first.version, session);
        assert("document" in changed);
        assertEquals(changed.changes?.map((c) => c.change), [{ op: "add" }]);
        assertEquals(
          await getDocumentChanges(id, second.version, session),
          { version: second.version },
        );
      });

      await t.step(
        "a save on an old base is refused as stale_base",
        async () => {
          const error = await assertRefused(
            () =>
              saveDocument(id, form({ base_version: first.version }), session),
            "stale_base",
          );
          assertEquals(error.status, 409);
          const data = staleBaseDataSchema.parse(error.data);
          assertEquals(data.version, second.version);
          assertEquals(data.document.id, id);
        },
      );

      await t.step("snapshots list", async () => {
        assert(Array.isArray(await listSnapshots(id, session)));
      });

      await t.step("share, read signed out, then revoke", async () => {
        const before = await getDocumentProfile(session);
        try {
          await updateDocumentProfile({ display_name: "SDK tester" }, session);
          const { share_token } = await createShareLink(id, session);

          const shared = await getSharedDocument(share_token);
          assertEquals(shared.version, second.version);
          assertEquals(shared.display_name, "SDK tester");
          assertEquals(shared.id, id);
          assertEquals(
            await getSharedDocumentChanges(share_token, second.version),
            { version: second.version },
          );
          const credit = await getDocumentCredit(id);
          assertEquals(credit.name, "SDK test");

          await revokeShareLink(id, session);
          await assertRefused(
            () => getSharedDocument(share_token),
            "not_found",
          );
        } finally {
          await updateDocumentProfile(before, session);
        }
      });

      await t.step(
        "soft delete, then permanent delete, then gone",
        async () => {
          await assertRefused(() => deleteDocument(id, session), "not_deleted");
          await saveDocument(
            id,
            form({
              base_version: second.version,
              body: { widgets: [1] },
              deleted_at: new Date().toISOString(),
            }),
            session,
          );
          await deleteDocument(id, session);
          created = false;
          const error = await assertRefused(
            () => getDocument(id, session),
            "gone",
          );
          assertEquals(error.status, 410);
        },
      );
    } finally {
      if (created) {
        // Clean up after a failed step: trash the document, then purge it.
        try {
          const doc = await getDocument(id, session);
          if (doc.deleted_at === null) {
            await saveDocument(
              id,
              form({
                base_version: doc.version,
                body: doc.body,
                deleted_at: new Date().toISOString(),
              }),
              session,
            );
          }
          await deleteDocument(id, session);
        } catch (error) {
          console.error(`Could not clean up document "${id}":`, error);
        }
      }
    }
  },
});
