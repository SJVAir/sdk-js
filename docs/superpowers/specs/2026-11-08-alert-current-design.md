# Alert current value (SDK)

Date: 2026-11-08. The SDK side of sjvair.com's
`docs/superpowers/specs/2026-11-08-alert-current-design.md` (branch
`feature/alert-current`), for data-dashboard step 4, spec 4 (Current
conditions). Read that spec for the why and the full server behaviour. This one
covers only what `@sjvair/sdk` adds.

## Why

The dashboard's Current conditions tile must show the same trailing 60-minute
average and level that the SMS alerts use. The server will serve the stored
result of its 10-minute alert run at a new endpoint, and publish the alert
config in `monitors/meta/`. The dashboard reads both through the SDK.

## Scope

On `release/5.0.0`, as **`5.0.0-beta.7`**. The SDK keeps no fallbacks for older
server responses: it ships together with sjvair.com `develop`.

### 1. `getMonitorAlertCurrent(monitorId, options?)`

A new `lib/monitors/get_monitor_alert_current.ts`. It follows the other
`get_monitor_*.ts` files: `jsonCall`, `RequestOptions`, module doc with an
example, an entry in `lib/monitors/mod.ts`, and an export path in `deno.json`.

- **Calls** `GET monitors/<monitorId>/alerts/current/` and returns `data`: a
  record keyed by entry type id (`"pm25"`, `"o3"`) of:

  ```ts
  {
    status: "ok" | "insufficient" | "no_data" | "pending";
    value: number | null;          // null unless status is "ok"
    level: string | null;          // level key from the monitors/meta/ scale; null unless "ok"
    window: { start: string; end: string } | null;   // ISO 8601 with offset
    latest_timestamp: string | null;
    readings: number | null;
    required: number | null;
    previous: { status: ...; value: number | null; level: string | null } | null;
    evaluated_at: string | null;
  }
  ```

  **Timestamps stay ISO strings (my call).** Every other getter returns them as
  strings, and `jsonCall` only casts the response, so this getter does the same.
- **A missing key means the pair isn't evaluated.** That's not an error. The
  record can be empty.
- **The statuses**, as doc comments on the type:
  - `insufficient`: under 50% of the expected readings, or an hourly feed's
    latest reading older than twice its interval
  - `no_data`: no readings, or an inactive monitor with no stored result
  - `pending`: no stored result yet, for example just after a server cache
    restart
- **A zod schema and a JSON fixture** in `lib/monitors/schemas/` and
  `lib/monitors/fixtures/`, like the others. The fixture covers `ok`,
  `insufficient` and `pending`.
- **Naming (my call):** the function name and file follow the `get_monitor_*`
  pattern. Exported types use the module's usual prefixes.

### 2. `getMonitorsMeta`: the `alerts` field

`sjvairMonitorEntryMetaSchema` gains `alerts`, nullable:

```ts
alerts: {
  window: string;               // "60 min"
  min_coverage: number;         // 0.5
  stage: string;
  processor: string | null;
  expected_interval: string | null;  // the alert series' override, e.g. "1h"
} | null
```

`null` means the server's alert run doesn't evaluate that monitor type and entry
type. Update the meta fixture and the module doc's example.

### 3. Release

- A CHANGELOG entry under 5.0.0, with a `5.0.0-beta.7` line in the betas
  paragraph naming the sjvair.com PR.
- `deno.json` version bumped to `5.0.0-beta.7`.
- **Publishing needs the user's explicit yes.**

## Tests

Follow `lib/monitors/mod_test.ts`:

- `getMonitorAlertCurrent` against the fixture: the URL called, the null fields
  when `pending`, and an empty record
- the meta schema parsing an `alerts` block and a `null`
- request-option forwarding, if `request_options_forwarding_test.ts` lists every
  getter

Account tests stay opt-in (`TEST_ACCOUNTS=1`). Don't run them.

## Out of scope

- Any client-side averaging or trend logic. The dashboard compares `value` with
  `previous.value`.
- A list variant.

## Left to the builder

- Exact type and schema names within the module's conventions.
- Whether the shared status union is its own exported type.
