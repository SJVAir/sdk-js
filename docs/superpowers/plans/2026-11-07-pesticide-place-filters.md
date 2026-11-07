# Pesticide place filters, meta and search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the SDK to sjvair.com #316: id-based `pesticides/place/` filters
with new options, a typed place-filter error helper, `getPesticidesMeta()`,
`searchPesticides()`, and the missing row fields.

**Architecture:** Thin wrappers over the existing HTTP layer (`jsonCall` /
`apiCall`), with Zod schemas as the source of every response type. The error
helper reads the `error.cause.details` that `genericAPIErrorHandler` already
fills. Each task adds one public piece with its own tests.

**Tech Stack:** Deno 2, TypeScript, Zod (`zinfer`), `@std/assert`, the stub in
`lib/http/fetch_stub_test_utils.ts`.

**Spec:** `docs/superpowers/specs/2026-11-07-pesticide-place-filters-design.md`
(read it first; this plan argues from it).

## Global Constraints

- Work in `/home/alex/workspace/sjvair/sdk-js/.worktrees/pesticide-filters`,
  branch `feature/pesticide-filters`. The PR goes into `release/5.0.0`.
- No fallbacks for older server responses: every new response field is required
  (no `.optional()`, `.default()`).
- Types come from Zod schemas via `zinfer`. The one exception is
  `PesticidePlaceFilterErrors`, which describes the helper's output, not a
  response.
- Each new module file gets a JSDoc block with `@example Usage` and `@module`,
  and an entry in `deno.json` `exports`
  (`"./pesticides/<file>": "./lib/pesticides/<file>.ts"`).
- Live tests are GETs against the local stack (`http://127.0.0.1:8000`) only.
  Nothing writes to the shared DB, restarts containers, or touches production. A
  live step catches `isUnavailable(error)` and skips with a `console.warn`, like
  the existing place step.
- No Claude or AI attribution in commits, PRs or docs.
- Never tag, publish or push a `v*` tag.
- Verification for every task:
  `deno fmt --check && deno lint && deno check mod.ts && deno test --allow-net --allow-env lib/pesticides/ lib/meta/ lib/request_options_forwarding_test.ts`.
  It must pass after every task. Commodity and product `display_name` aren't
  required until Task 7, so develop's rows validate until then.

## Review Focus

1. `category: []` (an empty list) sends no `category` param, and so isn't a
   filter. Test in Task 2.
2. A 400 whose `details` names only fields outside the place form (e.g.
   `__all__`) makes the helper return `undefined`, not `{}`. Test in Task 3.
3. A whitespace-only `q` (" ") makes no request and returns
   `{results: [], more: false}`. Test in Task 5.
4. A search or place param explicitly set to `undefined` (e.g.
   `{ narrow: undefined }`, from a form) is not sent. Tests in Task 2 and
   Task 5.
5. An abort while `getPesticidesForPlace` is pending rejects with the signal's
   reason, and the helper returns `undefined` for it. Test in Task 3.

---

### Task 1: Chemical and product row fields

**Files:**

- Modify: `lib/pesticides/schemas/chemical.ts`
- Modify: `lib/pesticides/schemas/product.ts`
- Test: `lib/pesticides/mod_test.ts` (new `Deno.test` "Module: pesticide row
  schemas")

**Interfaces:**

- Produces: `ChemicalData` gains
  `preferred_name: string; display_name: string; placeholder: boolean`.
  `ProductData` gains `cdpr_fumigant: boolean`. Every schema that embeds them
  (details, use, notice, summary) picks these up.

- [ ] **Step 1: Write the failing tests**

```ts
Deno.test("Module: pesticide row schemas", async (t) => {
  const chemical = {
    id: "gs65e",
    chem_code: 560,
    name: "SULFUR",
    preferred_name: "Sulfur",
    display_name: "Sulfur",
    cas_number: "7704-34-9",
    dtxsid: "DTXSID...",
    iarc_group: "",
    categories: [],
    placeholder: false,
  };
  await t.step("a chemical with the new fields parses", () => {
    assertEquals(chemicalSchema.safeParse(chemical).success, true);
  });
  for (const field of ["preferred_name", "display_name", "placeholder"]) {
    await t.step(`a chemical without ${field} is rejected`, () => {
      const { [field]: _, ...rest } = chemical as Record<string, unknown>;
      assertEquals(chemicalSchema.safeParse(rest).success, false);
    });
  }
  await t.step("a product without cdpr_fumigant is rejected", () => {
    const product = {
      id: "6ezxm",
      prodno: 68339,
      reg_number: "1-2",
      name: "X",
      fumigant: false,
      california_restricted: false,
    };
    assertEquals(productSchema.safeParse(product).success, false);
    assertEquals(
      productSchema.safeParse({ ...product, cdpr_fumigant: false }).success,
      true,
    );
  });
});
```

(Use a real `dtxsid` string from the local stack's `pesticides/chemicals/`.)

- [ ] **Step 2: Run it and see it fail**

Run:
`deno test --allow-net --allow-env lib/pesticides/mod_test.ts --filter "row schemas"`.
Expected: FAIL. The schema strips the unknown keys, so the "without" cases
parse.

- [ ] **Step 3: Add the fields.**
  - `chemicalSchema`: `preferred_name: z.string()` (CompTox's name, `""` when
    none), `display_name: z.string()` (what search and the explorer show), and
    `placeholder: z.boolean()` (CDPR's UNKNOWN / AI IS CONFIDENTIAL stand-ins:
    real applications with no pounds).
  - `productSchema`: `cdpr_fumigant: z.boolean()` (CDPR's raw flag; `fumigant`
    is the corrected one).
  - Add each to the file's `interface` with JSDoc, in server order (see the spec
    §5).

- [ ] **Step 4: Run the task's tests and the live pesticide steps**

Run: `deno test --allow-net --allow-env lib/pesticides/mod_test.ts`. Expected:
PASS, including the live list and detail steps, which now check the new fields.
(Commodity and product `display_name` come in Task 7.)

- [ ] **Step 5: Commit**:
      `feat(pesticides): Add the chemical name and placeholder fields, and cdpr_fumigant`

### Task 2: Place filters by id, with product, narrow, list category and method "none"

**Files:**

- Create: `lib/pesticides/schemas/narrow.ts` (`pesticideNarrowSchema`)
- Modify: `lib/pesticides/schemas/aerial_ground.ts` (add
  `aerialGroundFilterSchema`)
- Modify: `lib/pesticides/schemas/mod.ts` (export `narrow.ts`)
- Modify: `lib/pesticides/types.ts` (`PesticideNarrow`, `AerialGroundFilter`,
  `PesticidesForPlaceFilters`)
- Modify: `lib/pesticides/get_pesticides_for_place.ts`
- Test: `lib/pesticides/mod_test.ts` ("Module: pesticides for a place")

**Interfaces:**

- Produces:
  - `pesticideNarrowSchema = z.enum(["concern", "restricted", "fumigant", "aerial"])`;
    `type PesticideNarrow`.
  - `aerialGroundFilterSchema = z.enum(["A", "F", "G", "O", "none"])`;
    `type AerialGroundFilter`. `aerialGroundSchema` / `AerialGround` are
    unchanged.
  - `PesticidesForPlaceFilters` =
    `{ chemical?: string; commodity?: string; product?: string; category?: string | Array<string>; narrow?: PesticideNarrow; iarc_group?: IARCGroup; aerial_ground?: AerialGroundFilter; year__gte?: number; year__lte?: number }`,
    with JSDoc per the spec §1.

- [ ] **Step 1: Update and add the stubbed tests**

  - Change the existing "sends the place and only the filters given" step:
    `chemical: "gs65e"`, and assert `searchParams.get("chemical") === "gs65e"`.
  - New step "sends ids, narrow, method none and a list of categories":
    `{ product: "6ezxm", commodity: "9xvrg", narrow: "concern", aerial_ground: "none", category: ["carcinogen", "fumigant"] }`.
    Assert `searchParams.getAll("category")` equals `["carcinogen", "fumigant"]`
    and the other four values come back as given.
  - New step "one category is sent once": `category: "carcinogen"`, then
    `getAll("category")` equals `["carcinogen"]`.
  - New step "an empty category list and undefined values are not sent":
    `{ category: [], narrow: undefined, year__gte: 2022 }`. Assert the sorted
    keys equal `["region", "region_type", "year__gte"]`.

- [ ] **Step 2: Run and see them fail**

Expected: type errors (`chemical` is a `number`, there's no `product` or
`narrow`). After a local `as never` cast, `getAll("category")` is
`["carcinogen,fumigant"]`.

- [ ] **Step 3: Implement**
  - Add the schemas and types.
  - In `getPesticidesForPlace`, build
    `searchParams: Record<string, string | Array<string>>`. Skip `undefined`.
    Pass arrays through as `Array<string>` (an empty array adds nothing).
    `String()` the rest.
  - Update `@param filters` to name product and narrowing, and say ids are the
    list endpoints' `id`.

- [ ] **Step 4: Run the verification command.** Expected: PASS.

- [ ] **Step 5: Commit**:
      `feat(pesticides)!: Filter pesticide place use by our ids, with product, narrow and several categories`

### Task 3: `pesticidePlaceFilterErrors`

**Files:**

- Modify: `lib/pesticides/get_pesticides_for_place.ts` (helper and type; extend
  the module JSDoc example)
- Test: `lib/pesticides/mod_test.ts` (new `Deno.test` "Module: pesticide place
  filter errors")

**Interfaces:**

- Consumes: `getPesticidesForPlace` (Task 2).
- Produces:

```ts
export type PesticidePlaceFilterErrors = {
  chemical?: "invalid" | "not_found";
  commodity?: "invalid" | "not_found";
  product?: "invalid" | "not_found";
  category?: "invalid";
  narrow?: "invalid";
  iarc_group?: "invalid";
  aerial_ground?: "invalid";
  year__gte?: "invalid" | "min_value" | "max_value";
  year__lte?: "invalid" | "min_value" | "max_value";
};
export function pesticidePlaceFilterErrors(
  error: unknown,
): PesticidePlaceFilterErrors | undefined;
```

- [ ] **Step 1: Write the tests.** Build errors in the shape the HTTP layer
      throws: `new Error("x", { cause: { result: { status }, details } })`.
  - "returns the first code of each place field": `status: 400`,
    `details = { chemical: [{message: "a", code: "not_found"}, {message: "b", code: "invalid"}], year__gte: [{message: "c", code: "min_value"}], __all__: [{message: "d", code: "x"}] }`.
    Expect `{ chemical: "not_found", year__gte: "min_value" }`.
  - "undefined when only unknown fields": `details = { __all__: [...] }`. Expect
    `undefined`.
  - "undefined for a 404", for a 400 with `details: undefined`, for `"why"` (a
    string), for `new DOMException("", "AbortError")`, and for `new Error("x")`
    with no cause. Expect `undefined` each time.
  - "a 400 through getPesticidesForPlace": stub a response with
    `new Response(JSON.stringify({ errors: { chemical: [{ message: "No chemical has this id.", code: "not_found" }] } }), { status: 400, headers: { "Content-Type": "application/json" } })`.
    Call with `chemical: "gs65e"` and catch. The helper gives
    `{ chemical: "not_found" }`.
  - "an abort is not a filter error": a stubbed call with an `AbortController`
    aborted before the call. The rejection `===` the signal's reason, and the
    helper on it returns `undefined`.
  - Live step "an over-long id is invalid":
    `getPesticidesForPlace(county, { chemical: "z".repeat(33) })` rejects, and
    the helper gives `{ chemical: "invalid" }`. Skip when `isUnavailable`.

- [ ] **Step 2: Run and see them fail** (the helper isn't defined).

- [ ] **Step 3: Implement.**
  - Return `undefined` unless `error instanceof Error`,
    `cause.result.status === 400`, and `cause.details` is a non-null object.
  - Walk a fixed list of the nine field names. Take `details[field]?.[0]?.code`
    when it's a string.
  - Return `undefined` if nothing was collected.

- [ ] **Step 4: Run the verification command.** Expected: PASS.

- [ ] **Step 5: Commit**:
      `feat(pesticides): Add pesticidePlaceFilterErrors for the place filter codes`

### Task 4: `getPesticidesMeta`

**Files:**

- Create: `lib/pesticides/schemas/pesticides_meta.ts` (`pesticidesMetaSchema`)
- Create: `lib/pesticides/get_pesticides_meta.ts`
- Create: `lib/pesticides/fixtures/pesticides_meta.json`, captured with
  `curl -s http://127.0.0.1:8000/api/2.0/pesticides/meta/`
- Modify: `lib/pesticides/schemas/mod.ts`, `lib/pesticides/types.ts`
  (`PesticidesMeta`), `lib/pesticides/mod.ts`, `deno.json`
- Test: `lib/pesticides/mod_test.ts` (new `Deno.test` "Module: pesticides
  meta"), `lib/request_options_forwarding_test.ts`

**Interfaces:**

- Consumes: `iarcGroupSchema`, `pesticideNarrowSchema`,
  `aerialGroundFilterSchema` (Task 2).
- Produces:
  `getPesticidesMeta(options?: RequestOptions): Promise<PesticidesMeta>`. The
  shape is the spec §3:
  - `categories{key, label, description, in_use}`;
  - `iarc_groups{key: IARCGroup, label, description}`;
  - `methods{key: AerialGroundFilter, label}`;
  - `narrows{key: PesticideNarrow, label, description}`;
  - `placeholder_chemicals{id, name}`.

- [ ] **Step 1: Write the tests.**
  - "the fixture matches the schema": validate `fixture.data`. Check
    `categories.length === 10`, that some category has `in_use === false`, that
    `methods.map(m => m.key)` equals `["G", "A", "F", "O", "none"]`, and that
    `placeholder_chemicals.length > 0`.
  - "a category without in_use is rejected": `safeParse` fails.
  - "fetches pesticides/meta/" (stubbed): the path is
    `/api/2.0/pesticides/meta/`, and the result equals `fixture.data`.
  - Live "GET pesticides/meta/": validate, 10 categories.
  - Forwarding: add `["getPesticidesMeta", (o) => getPesticidesMeta(o)]` to the
    table in `lib/request_options_forwarding_test.ts`.

- [ ] **Step 2: Run and see them fail.**

- [ ] **Step 3: Implement.** Use
      `jsonCall<PesticidesMeta>({ url: "pesticides/meta", options })`.
  - JSDoc: keys are permanent and labels may change; `methods` covers use
    records only; `in_use` is false for categories no import assigns; this is
    the catalog `meta_url` for `pesticide-use` and `pesticide-notices`.
  - Export it from `mod.ts` and `deno.json`.

- [ ] **Step 4: Run the verification command.** Expected: PASS.

- [ ] **Step 5: Commit**: `feat(pesticides): Add getPesticidesMeta`

### Task 5: `searchPesticides`

**Files:**

- Create: `lib/pesticides/schemas/pesticide_search.ts`
  (`pesticideSearchHitSchema`, `chemicalSearchHitSchema`)
- Create: `lib/pesticides/search_pesticides.ts`
- Create: `lib/pesticides/fixtures/pesticide_search_chemical.json`
  (`?type=chemical&q=sulf&limit=3`) and
  `lib/pesticides/fixtures/pesticide_search_commodity.json`
  (`?type=commodity&q=wheat&limit=3`), captured from the local stack
- Modify: `lib/pesticides/schemas/mod.ts`, `lib/pesticides/types.ts`,
  `lib/pesticides/mod.ts`, `deno.json`
- Test: `lib/pesticides/search_pesticides_test.ts` (modeled on
  `lib/regions/search_locations_test.ts`), and
  `lib/request_options_forwarding_test.ts`

**Interfaces:**

- Consumes: `PesticideNarrow` (Task 2).
- Produces:
  - `pesticideSearchHitSchema = z.object({ id: z.string(), name: z.string(), detail: z.string() })`;
  - `chemicalSearchHitSchema = pesticideSearchHitSchema.extend({ placeholder: z.boolean() })`;
  - types `PesticideSearchHitData`, `ChemicalSearchHitData`;
  - `type PesticideSearchType = "chemical" | "product" | "commodity"`;
  - `type PesticideSearchHit<T extends PesticideSearchType> = T extends "chemical" ? ChemicalSearchHitData : PesticideSearchHitData`;
  - `type PesticideSearchResult<T> = { results: Array<PesticideSearchHit<T>>; more: boolean }`;
  - `PesticideSearchParams<T>` exactly as in the spec §4;
  - `searchPesticides<T extends PesticideSearchType>(params: PesticideSearchParams<T>): Promise<PesticideSearchResult<T>>`.

- [ ] **Step 1: Write the tests.**
  - "fixtures match the schemas": the chemical fixture's `results` validate
    against `chemicalSearchHitSchema`, and the commodity fixture's against
    `pesticideSearchHitSchema`. Both have a boolean `more`.
  - "sends type, q, limit, year, county and narrow":
    `{ type: "chemical", q: " sulf ", limit: 5, year: 2022, county: "fresno", narrow: "concern" }`.
    The path ends `/pesticides/search/`, and `q === "sulf"`, `limit === "5"`,
    `year === "2022"`.
  - "year all is sent as all".
  - "unset and undefined params are not sent":
    `{ type: "product", q: "round", narrow: undefined }`. The sorted keys are
    `["q", "type"]`.
  - "a short or blank q makes no request": for `"s"` and `"   "`,
    `stub.calls.length === 0` and the result equals
    `{ results: [], more: false }`.
  - "returns results and more at the top level": stub the chemical fixture. The
    result equals `{ results: fixture.results, more: fixture.more }`.
  - Type check: in the chemical test,
    `const flag: boolean = result.results[0].placeholder;` compiles. Add a
    `// @ts-expect-error` line reading `.placeholder` on a `type: "commodity"`
    result.
  - Live "chemical sulf leads with Sulfur": `results[0].name === "Sulfur"`. Skip
    when `isUnavailable`.
  - Forwarding: add
    `["searchPesticides", (o) => searchPesticides({ type: "chemical", q: "sulf", ...o })]`.

- [ ] **Step 2: Run and see them fail.**

- [ ] **Step 3: Implement.** Model it on `searchLocations`.
  - Trim `q`. Under 2 characters, return `{ results: [], more: false }` without
    a request.
  - Call
    `apiCall<PesticideSearchResult<T>>({ url: "pesticides/search", searchParams, options })`.
    The body has no `data` envelope.
  - Stringify numbers. Leave out `undefined` values.
  - JSDoc: `id` is what `getPesticidesForPlace` takes; one page only; the server
    caps `limit` at 25 (default 10).

- [ ] **Step 4: Run the verification command** (plus
      `lib/pesticides/search_pesticides_test.ts`). Expected: PASS.

- [ ] **Step 5: Commit**:
      `feat(pesticides): Add searchPesticides over pesticides/search/`

### Task 6: Code-based getter docs, catalog fixture, api-urls and changelog

**Files:**

- Modify: the `chemical` / `commodity` / `product` JSDoc in
  `lib/pesticides/get_pesticide_use_list.ts`, `get_pesticide_notice_list.ts`,
  `get_region_pesticide_summary.ts`, `get_region_pesticide_use.ts` and
  `get_region_pesticide_notices.ts` (wherever those filters are typed or
  documented)
- Modify: `lib/meta/fixtures/dataset_catalog.json` (the `pesticide-use` and
  `pesticide-notices` entries only), `lib/meta/mod_test.ts:70-73`
- Modify: `api-urls.md`, `CHANGELOG.md`

- [ ] **Step 1: Update the catalog test first.**
  - `pesticide-use` now has `meta_url === "/api/2.0/pesticides/meta/"`, and its
    `entry_types` ids are `["pounds-applied", "acres-treated", "applications"]`.
  - Keep `license === ""` and `places_url === ""` on it.
  - Move the empty-`meta_url` assertion to `calenviroscreen`.

- [ ] **Step 2: Run and see it fail** against the stale fixture.

- [ ] **Step 3: Refresh the two dataset entries** from
      `curl -s http://127.0.0.1:8000/api/2.0/meta/datasets/`, copying those two
      objects only.

- [ ] **Step 4: Update the code-based getters' docs.**
  - Each filter says "the CDPR chem code / site code / product number, not the
    `id`; `getPesticidesForPlace` takes ids".
  - Types are unchanged.

- [ ] **Step 5: Update the bookkeeping.**
  - `api-urls.md`: tick `pesticides/search/`, and add
    `- [x] /api/2.0/pesticides/meta/`.
  - `CHANGELOG.md` under 5.0.0, the Breaking and Added lines from the spec §8,
    each ending with the PR number once known.

- [ ] **Step 6: Run the verification command.** Expected: PASS.

- [ ] **Step 7: Commit**:
      `docs(pesticides): Say which getters take CDPR codes; refresh the catalog fixture; changelog`

### Task 7 (blocked): Commodity and product `display_name`

**Start only when** the sjvair.com PR adding `display_name` to commodity and
product rows (session sjvair-com-48) has merged into `develop` and the local
stack runs it. Check with
`curl -s 'http://127.0.0.1:8000/api/2.0/pesticides/commodities/?page=1'`: the
rows must have `display_name`. If that PR's shape differs from the spec, follow
the PR and update the spec in this task.

**Files:**

- Modify: `lib/pesticides/schemas/commodity.ts`,
  `lib/pesticides/schemas/product.ts`
- Modify: any fixture that embeds commodity or product rows (search
  `lib/**/fixtures/*.json` for `"site_code"` and `"prodno"`), recaptured from
  the local stack
- Test: `lib/pesticides/mod_test.ts` ("Module: pesticide row schemas")

- [ ] **Step 1: Add the tests.** A commodity without `display_name` is rejected
      and one with it parses. Do the same for a product.
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Add `display_name: z.string()`** to both schemas, with JSDoc.
      For commodity it's the humanized name ("Wheat (forage - fodder)"); for
      product it's the same as `name`. Refresh the fixtures.
- [ ] **Step 4: Run the full suite:** `deno test --allow-net --allow-env`.
      Expected: PASS, with only the skips the repo already documents.
- [ ] **Step 5: Commit**:
      `feat(pesticides): Add display_name to commodity and product rows`, and
      add the CHANGELOG line.

Then open the PR into `release/5.0.0`. The PR body says it needs a server
running sjvair.com `develop` with #316 and the `display_name` PR. Send the
coordinator (data-dashboard-23) the PR number.

### Task 8 (blocked): Catalog entry aggregate hint

**Start only when** sjvair-com-48's catalog PR (per-entry `display.aggregate`,
spec §9) has merged into `develop` and the local stack serves it. Check with
`curl -s http://127.0.0.1:8000/api/2.0/meta/datasets/`: the field must be on
every entry's `display`. Take the exact name, values and nullability from that
PR. If they differ from spec §9, update the spec in this task.

Do it before opening the PR. Task 7's last step (open the PR, tell the
coordinator) moves to the end of this task.

**Files:**

- Modify: `lib/meta/schemas/dataset_catalog.ts` (`DatasetEntryDisplaySchema` and
  `datasetEntryDisplaySchema`)
- Modify: `lib/meta/fixtures/dataset_catalog.json` (recapture it whole from the
  local stack, then recheck Task 6's assertions)
- Test: `lib/meta/mod_test.ts`

- [ ] **Step 1: Write the tests.**
  - The fixture's `pounds-applied` entry has `display.aggregate === "sum"`.
  - An air-quality entry, e.g. `pm25`, has `"mean"`, or whatever values the PR
    uses.
  - A `display` without the field is rejected.
- [ ] **Step 2: Run and see them fail.**
- [ ] **Step 3: Add the field** as the PR defines it, e.g.
      `aggregate: z.enum(["sum", "mean"]).nullable()`, with JSDoc. Make it
      required. Recapture the fixture.
- [ ] **Step 4: Run the full suite:** `deno test --allow-net --allow-env`.
      Expected: PASS.
- [ ] **Step 5: Commit:** `feat(meta): Add the catalog entry aggregate hint`.
      Add a CHANGELOG line.

Then open the PR into `release/5.0.0`. The body says it needs a server running
sjvair.com `develop` with #316, #317 and the aggregate PR. Send the coordinator
the PR number.
