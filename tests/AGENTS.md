# Playwright test rules (applies under tests/)

Nearest `AGENTS.md` wins; this file adds to the root one. See the parent file for
the project map, commands, and environment.

## Layout

- One screen: `tests/features/<area>/<screen>.spec.ts`
- Several screens: `tests/e2e/<flow>.spec.ts`
- Sign-in bootstrap: `tests/auth.setup.ts` (project `setup`)
- Page objects: `pages/*.ts` | fixtures: `fixtures/*.ts` | helpers: `utils/`
- Test plans written by the planner: `specs/*.md`

## Locators

- `getByRole` > `getByLabel` / `getByText` > `getByTestId`.
- No CSS classes, XPath, or `nth()` unless no accessible attribute exists; add a
  comment explaining why.
- Scope a locator to a region (`page.getByRole("main")`, `getByRole("dialog")`)
  when the same label appears in a header or a second form.
- When a show-password or clear button sits inside the `<label>`, the accessible
  name includes it; match with a prefix regex, not `exact: true`.

## Waits and assertions

- Never `page.waitForTimeout()`. Use web-first assertions:
  `await expect(locator).toBeVisible()`.
- Do not use `if (await locator.isVisible())` as a check. It does not wait.
- Navigation: `await expect(page).toHaveURL(/\/dashboard$/)`.
- Assert the message the user sees, not a status code or an internal id.

## Isolation and data

- Each test passes alone and in any order.
- Sign in through `storageState` (`.auth/user.json`), never by filling the login
  form inside a test body. `tests/auth.setup.ts` produces it.
- Generate unique data per test (`pw-<screen>-${Date.now()}@example.test`). Never
  delete or modify seeded accounts.
- Use `baseURL` from config. No hardcoded hosts or ports.
- Mock third-party services with `page.route()`. Never mock the app under test in
  E2E tests.

## Screenshots for test reports (required)

Every spec produces images the test report links to. Use
`fixtures/screenshot.ts`; do not call `page.screenshot` directly.

- Directory: `test-results/screenshots/{SCREEN_ID}/`
- Pass shot: `{SCREEN_ID}-{NN}-{case-slug}.png`, taken after the expected state is
  reached.
- Fail shot: `{SCREEN_ID}-FAIL-{case-slug}.png`, taken from `test.afterEach` via
  `shotOnFailure`, so a broken screen is still documented.
- No secrets, passwords, or tokens visible in the frame.

```typescript
import { test, expect } from "@playwright/test";
import { shot, shotOnFailure } from "@/fixtures/screenshot";

const SCREEN = "USER-003";

test.afterEach(async ({ page }, testInfo) => {
  await shotOnFailure(page, SCREEN, testInfo);
});

test("01 - renders the login form", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await shot(page, SCREEN, `${SCREEN}-01-renders-form`);
});
```

`test-results/` is git-ignored. Report rows reference an image as
`../../../test-results/screenshots/{SCREEN_ID}/{file}.png` when the report lives
three levels deep.

## Definition of done

- The spec passes on a clean run, and `npm run typecheck` passes.
- One scenario per `test()`, named as a user outcome (`01 - rejects a wrong
  password`, not `test login 2`).
- `--repeat-each=3` passes for a new or changed spec.
- No credentials, tokens, or secrets in specs, screenshots, or reports.

## Out of scope

- No new dependencies. Do not silence failures with `test.skip` / `test.fixme`;
  report them.
- Do not change `playwright.config.ts` or the project globs to make a spec run.
