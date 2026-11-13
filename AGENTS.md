# AGENTS.md

Playwright end-to-end test project for one web application at `BASE_URL`. The app
under test lives in its own repository; do not put application source or backend
test rules here.

<!-- Stack: @playwright/test 1.64.1 (pinned) | TypeScript ^5.8 | Node 20+ | Docker optional -->

## Project map

```text
playwright.config.ts        # projects, BASE_URL guard, artifact policy
tests/auth.setup.ts         # storageState bootstrap (.auth/user.json)
tests/features/<area>/      # one screen under test, e.g. features/auth/login.spec.ts
tests/e2e/                  # flows that walk several screens
tests/seed.spec.ts          # scaffold for the planner agent
tests/example.spec.ts       # Playwright demo, not collected by any project
fixtures/                   # shared test helpers (test.ts, screenshot.ts)
pages/                      # Page Object Model classes
utils/                      # helpers that are not fixtures
data/                       # test data (JSON, CSV, upload files)
specs/                      # Markdown test plans written by the planner
scripts/pw.cmd              # Windows wrapper for the Docker Compose shell
docker/                     # Dockerfile, docker-compose.yml, entrypoint.sh
.agents/skills/             # playwright-cli, security-audit, humanizer skills
.opencode/agents/           # Playwright Test Agents (planner, generator, healer)
```

Split by scope, not convenience: `tests/features/` holds one screen, `tests/e2e/`
holds a flow across screens. Never repeat a screen-level case inside a journey.

Anything outside the project globs in `playwright.config.ts` is never collected.

## Commands (use these exact commands)

- Install: `npm ci`
- Test all: `npm test` | One file: `npx playwright test tests/<path>.spec.ts`
- One browser: `npx playwright test --project=chromium`
- Flake check: `npm run test:flake <path>`
- Typecheck: `npm run typecheck` | Report: `npm run test:report`
- Discover without running: `npx playwright test --list`
- Docker shell: `scripts\pw.cmd` | One-shot run: `dcp --profile test run --rm test`

There is no lint step and no build step. Playwright transpiles TypeScript on the
fly; `npm run typecheck` validates types only.

## Working rules

- Read the relevant files before editing. Do not guess paths, APIs, or function
  names; search the repo.
- Match the style of surrounding code. Do not reformat or rename unrelated code.
- Make the smallest change that solves the task. One concern per change.
- Reuse `pages/` and `fixtures/` when they fit; do not add a page object or
  fixture for a single spec.
- If the task is ambiguous or touches more than ~5 files, state your plan first
  and ask.

## Code conventions

- TypeScript strict. No `any` without a comment explaining why.
- `PascalCase` classes, `camelCase` functions and variables, kebab-case file names.
- Import from `@/*` (maps to the repo root) instead of long relative paths.
- Handle errors explicitly. Never swallow exceptions with an empty catch.
- No `console.log` left in committed code.
- Comments explain why, not what. Remove dead code instead of commenting it out.

## Security and secrets

- Never commit `.env`, `.auth/`, or `.playwright-cli/`. Read config from
  environment variables.
- Never log credentials, tokens, or personal data. No secrets in specs,
  screenshots, reports, or traces.
- Never modify or delete seeded accounts; create fresh data per test.
- Do not add or upgrade dependencies without asking. If approved, pin the version.

## Testing

- New behavior needs a test. A bug fix needs a regression test that fails before
  the fix.
- Tests must be deterministic: no fixed sleeps, no dependence on test order, no
  dependence on leftover data.
- Never delete, skip, or weaken a test to make a run pass. Report the failure.
- E2E and Playwright rules: see `tests/AGENTS.md`.

## Git and PRs

- Branch: `<type>/<short-description>`. Commits: Conventional Commits (`feat:`,
  `fix:`, `chore:`, `docs:`, `test:`).
- Do not commit to `main`, force-push, or rewrite shared history.
- PR description: what changed, why, how it was tested.

## Definition of done

- [ ] `npm run typecheck` passes.
- [ ] The relevant specs pass, and `npm run test:flake <path>` passes for a new or
      changed spec.
- [ ] No unrelated files changed; no leftover debug code.
- [ ] README updated if commands, env vars, or layout changed.
- Final message: list files changed, commands run with results, and anything left
      unverified.

## Out of scope (ask first)

- CI/CD files, infra, Dockerfiles, lockfiles (unless the task is about them).
- Auth or payment flows of the application under test.
- Deleting files or data, bulk renames, large refactors.
- Anything under `node_modules/`, `playwright-report/`, `test-results/`.
