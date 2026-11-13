# Playwright Test Project

End-to-end test project built with [Playwright](https://playwright.dev/) and TypeScript, running inside Docker. It includes the **Playwright CLI** (`@playwright/cli`), **Playwright Test Agents** (planner, generator, healer), and the agent skills for browser automation, security audit, and prose editing.

Clone this repository for a new application, then set `BASE_URL` and align `pages/`, `tests/features/`, and `tests/e2e/` with the screens you test.

## Table of Contents

- [Playwright Test Project](#playwright-test-project)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Prerequisites](#prerequisites)
  - [Build \& Setup](#build--setup)
    - [Option A: Docker (recommended)](#option-a-docker-recommended)
    - [Option B: Local (without Docker)](#option-b-local-without-docker)
    - [Verify the build](#verify-the-build)
    - [Rebuilding after changes](#rebuilding-after-changes)
  - [Environment Variables](#environment-variables)
  - [Running Tests](#running-tests)
    - [npm scripts](#npm-scripts)
    - [Browsers](#browsers)
    - [Artifacts](#artifacts)
    - [Screenshots for test reports](#screenshots-for-test-reports)
  - [Playwright CLI](#playwright-cli)
    - [`scripts/pw.cmd`](#scriptspwcmd)
  - [Playwright Agents](#playwright-agents)
    - [Regenerating the agents after a Playwright upgrade](#regenerating-the-agents-after-a-playwright-upgrade)
  - [Agent skills](#agent-skills)
  - [Writing Tests](#writing-tests)
    - [Conventions](#conventions)
  - [Reports \& Debugging](#reports--debugging)
  - [How the Docker Setup Works](#how-the-docker-setup-works)
  - [Git Conventions](#git-conventions)
  - [Troubleshooting](#troubleshooting)
  - [References](#references)

## Tech Stack

| Component | Version |
| --- | --- |
| Playwright (`@playwright/test`) | 1.64.1 (pinned) |
| TypeScript | ^5.8 |
| Node.js types | ^22 |
| dotenv | ^16.4 |
| Docker base image | `mcr.microsoft.com/playwright:v1.64.1-noble` |

> `PLAYWRIGHT_VERSION` (Docker) **must match** the `@playwright/test` version in `package.json`. That is why `@playwright/test` is pinned without a `^`. A mismatch causes browser incompatibility errors, and the container prints a warning on startup if it detects one.

## Project Structure

```text
playwright/
├── data/                   # Test data (JSON, CSV, upload files, ...)
├── docker/
│   ├── Dockerfile          # Playwright image + @playwright/cli
│   ├── docker-compose.yml  # playwright (shell) and test (one-shot run) services
│   └── entrypoint.sh       # Auto-installs dependencies when package-lock.json changes
├── fixtures/
│   ├── test.ts             # Custom fixtures (extends @playwright/test)
│   └── screenshot.ts       # shot / shotOnFailure for report images
├── pages/                  # Page Object Model classes
├── scripts/
│   └── pw.cmd              # Windows helper script
├── specs/                  # Markdown test plans written by the planner agent
├── tests/
│   ├── auth.setup.ts       # Signs in once, saves .auth/user.json
│   ├── features/           # One screen under test
│   ├── e2e/                # Flows across several screens
│   └── example.spec.ts     # Playwright demo, not part of any project
├── utils/                  # Shared helpers
├── .agents/skills/         # playwright-cli, security-audit, humanizer
├── .opencode/agents/       # planner, generator, healer subagents
├── opencode.json           # MCP server registration
├── playwright-report/      # HTML report (generated, git-ignored)
├── test-results/           # Traces, screenshots, videos (generated, git-ignored)
├── .env                    # Local environment variables (not committed)
├── .env.example            # Environment template (committed)
├── .dockerignore
├── .gitignore
├── package.json
├── package-lock.json       # Commit this file
├── playwright.config.ts    # Playwright configuration
├── tsconfig.json
└── README.md
```

## Prerequisites

**Docker (recommended)**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Compose **v2.24 or newer** (needed for the optional `env_file` setting)
- Git

**Local (optional)**

- Node.js 20 or newer
- npm 10 or newer

## Build & Setup

### Option A: Docker (recommended)

**1. Clone the repository**

```bash
git clone <repo-url>
```

**2. Create the environment file**

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows (cmd)
copy .env.example .env
```

Edit `.env` and set `BASE_URL` to the application under test (see [Environment Variables](#environment-variables)). `.env` and `.env.example` start with a dot, so some file browsers hide them.

**3. Build the Docker image**

```bash
docker compose -f docker/docker-compose.yml build
```

Optional: add a shortcut for the long command.

```bash
# macOS / Linux / Git Bash
alias dcp='docker compose -f docker/docker-compose.yml'
# Window
alias dcp=docker compose -f docker/docker-compose.yml $*
```

The examples below use `dcp` as shorthand for the full command.


**4. Install dependencies on Windows (Optional)**

If you use VS Code or another IDE on Windows and want IntelliSense, TypeScript autocompletion, and code navigation, install dependencies locally:

```bash
npm ci
```

> This step is optional and only needed for IDE support. Tests still run inside Docker, where dependencies are managed separately.

**5. Open a shell in the container**

```bash
dcp run --rm playwright
```

You are now in `/workspace`, which is your project folder mounted into the container. On the first start, the entrypoint runs `npm ci` automatically, so there is **no manual install step**.

**6. Type-check and run the tests**

```bash
npm run typecheck
npm test
```

Or run all tests in one command without opening a shell:

```bash
dcp --profile test run --rm test
```

### Option B: Local (without Docker)

```bash
git clone <repo-url>
cd playwright

cp .env.example .env                  # set BASE_URL to http://localhost:<port>
npm ci                                # install dependencies
npx playwright install --with-deps    # download browsers and OS dependencies
npm run typecheck
npm test
```

When running locally, `BASE_URL` should point to `http://localhost:<port>` instead of `host.docker.internal`.

### Verify the build

| Check | Command | Expected result |
| --- | --- | --- |
| Compose file is valid | `dcp config` | Prints the resolved configuration, with your `BASE_URL` |
| Docker image builds | `dcp build` | Completes without errors |
| Dependencies installed | `npm ls @playwright/test` | Shows version `1.64.1` |
| TypeScript compiles | `npm run typecheck` | No output, exit code 0 |
| Tests are discovered | `npx playwright test --list` | Lists tests from `tests/` |
| Playwright CLI available | `playwright-cli --help` | Prints usage |

> There is no separate compile step. Playwright transpiles TypeScript on the fly, and `npm run typecheck` (`tsc --noEmit`) validates types only.

### Rebuilding after changes

| Change | What to do |
| --- | --- |
| Edited `package.json` dependencies | Run `npm install` in the container, commit the updated `package-lock.json`. The entrypoint reinstalls automatically on the next start |
| Edited `Dockerfile` or `entrypoint.sh` | `dcp build` |
| Changed `PLAYWRIGHT_VERSION` or `PLAYWRIGHT_CLI_VERSION` | `dcp --env-file .env build --no-cache` (see the note below) |
| Corrupted or stale `node_modules` volume | `dcp down -v`, then start the container again |
| Upgrading Playwright | Update `PLAYWRIGHT_VERSION` in `.env` and `@playwright/test` in `package.json`, then `dcp --env-file .env build --no-cache`, `dcp down -v`, and start again |

> **Why `--env-file .env` for builds?** Compose reads values for `${...}` interpolation (such as the build args) from a `.env` next to the compose file, not from the project root. Pass `--env-file .env` whenever you override `PLAYWRIGHT_VERSION` or `PLAYWRIGHT_CLI_VERSION`. Runtime variables such as `BASE_URL` and `CI` are loaded separately through `env_file` and need no flag.

## Environment Variables

Defined in `.env` (copy from `.env.example`):

| Variable | Default | Description |
| --- | --- | --- |
| `PLAYWRIGHT_VERSION` | `1.64.1` | Playwright image version used at Docker build time. Must match `@playwright/test` |
| `PLAYWRIGHT_CLI_VERSION` | `latest` | Version of `@playwright/cli` installed in the image. Pin it for reproducible builds (`npm view @playwright/cli version`) |
| `BASE_URL` | `http://host.docker.internal:8000` | URL of the application under test. **Required**: the config throws an error if it is missing |
| `CI` | `false` | When `true`: 2 retries, 1 worker, and `test.only` is forbidden |
| `SLOW_MO` | `0` | Milliseconds added to every action, so a headed run can be followed by eye. `0` disables it |
| `APP_USER_EMAIL` / `APP_USER_PASSWORD` | *(empty)* | Account used by `tests/auth.setup.ts` to save `.auth/user.json`. Leave empty to skip the `setup` project |

To reach an app running on your host machine from inside the container, use `host.docker.internal` instead of `localhost`. The compose file maps it via `extra_hosts`, so it also works on Linux. Make sure your app listens on `0.0.0.0`, not only `127.0.0.1`.

## Running Tests

Run these inside the container (or locally for Option B):

```bash
npm test                 # all tests, headless
npm run test:report      # open the HTML report
npm run typecheck        # TypeScript check
```

Targeted runs:

```bash
npx playwright test tests/example.spec.ts          # one file
npx playwright test -g "test title"                # by title
npx playwright test --project=chromium             # the main browser
npx playwright test --repeat-each=3                # flake check
npx playwright test --list                         # list without running
```

A headed run a human can watch, used when collecting report screenshots:

```powershell
$env:SLOW_MO='400'
npx playwright test tests/features/<area>/<screen>.spec.ts --headed --workers=1
```

One-shot runs from the host (no interactive shell), for example in CI:

```bash
dcp --profile test run --rm test                                   # all tests
dcp --profile test run --rm test npx playwright test --project=chromium
```

### npm scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm test` | `playwright test` | Run tests headless |
| `npm run test:headed` | `playwright test --headed` | Run with a visible browser* |
| `npm run test:ui` | `playwright test --ui` | Open UI Mode* |
| `npm run test:debug` | `playwright test --debug` | Debug with Playwright Inspector* |
| `npm run test:report` | `playwright show-report` | Open the HTML report |
| `npm run test:flake` | `playwright test --repeat-each=3` | Repeat each test three times to catch flakiness |
| `npm run agents:init` | `playwright init-agents` | Regenerate the Playwright Test Agents |
| `npm run typecheck` | `tsc --noEmit` | Type-check only |

\* Headed, UI, and debug modes need a display and do not work directly inside the container. Run them locally (Option B), or set up X11/VNC forwarding for the container.

### Browsers

Configured in `playwright.config.ts`: **Chromium** (`chromium`), plus a `setup` project that saves the signed-in session to `.auth/user.json`. Firefox and WebKit projects are present as comments; uncomment them when the app supports those engines.

To make a spec run signed in, load the saved session on the project:

```typescript
{ name: "chromium", storageState: ".auth/user.json", dependencies: ["setup"] }
```

`tests/auth.setup.ts` skips itself when `APP_USER_EMAIL` / `APP_USER_PASSWORD` are empty, so specs that need no sign-in run without the setup project.

### Artifacts

| Type | Policy |
| --- | --- |
| Trace | `retain-on-failure` |
| Screenshot | `only-on-failure` |
| Video | `retain-on-failure` |

Output goes to `test-results/`; the HTML report goes to `playwright-report/`.

### Screenshots for test reports

Specs in `tests/features/` and `tests/e2e/` leave images a report can link to. Use the helpers in `fixtures/screenshot.ts` instead of calling `page.screenshot` directly:

| File | When |
| --- | --- |
| `test-results/screenshots/{SCREEN_ID}/{SCREEN_ID}-{NN}-{case-slug}.png` | On the expected state, via `shot(page, SCREEN, name)` |
| `test-results/screenshots/{SCREEN_ID}/{SCREEN_ID}-FAIL-{case-slug}.png` | On failure, via `shotOnFailure` in `test.afterEach` |

`test-results/` is git-ignored. See `tests/AGENTS.md` for the full convention.

## Playwright CLI

The Docker image installs `@playwright/cli` globally. It lets you drive a browser from the command line, which is useful for exploring pages, taking snapshots, and trying selectors, and it is the same tooling AI agents can use.

```bash
playwright-cli --help
```

Command names can change between versions, so use `--help` for the current list. If the CLI creates new folders in the project root (for example snapshots), check `git status` and add them to `.gitignore`.

### `scripts/pw.cmd`

A Windows helper script for running Playwright-related commands without typing the full Docker Compose command. See the file for exact usage, for example:

```bat
scripts\pw.cmd npx playwright test
```

## Playwright Agents

Playwright Test Agents provide three roles:

| Agent | Role |
| --- | --- |
| Planner | Explores the app and writes a Markdown test plan to `specs/` |
| Generator | Turns the plan into Playwright test files under `tests/` |
| Healer | Runs tests and repairs failing ones |

They are committed in this repository and need no setup:

| File | Purpose |
| --- | --- |
| `.opencode/agents/playwright-test-{planner,generator,healer}.md` | Subagent definitions: description, mode, permissions, prompt |
| `opencode.json` | Registers the `playwright-test` MCP server (`npx playwright run-test-mcp-server`) |
| `.agents/skills/playwright-cli/` | Browser automation skill for the CLI, with references |
| `specs/` | Where the planner saves test plans |
| `tests/seed.spec.ts` | Seed test the planner and generator start from |

Ask for one of them by name, for example: "use the playwright-test-planner subagent to plan the settings screen".

### Regenerating the agents after a Playwright upgrade

```bash
npm run agents:init
```

`init-agents` writes an OpenCode configuration in the older V1 shape (`mcp.playwright-test`, `agent.*.prompt`, `.opencode/prompts/`). This repository uses the V2 shape (`mcp.servers`, agent files under `.opencode/agents/`). After regenerating, keep this repository's format:

1. Diff `opencode.json`; move any new server or tool settings under `mcp.servers`.
2. Move prompt text into `.opencode/agents/*.md` and delete `.opencode/prompts/`.
3. Keep the `permissions` blocks, so the planner stays read-only.

## Agent skills

Installed under `.agents/skills/`, discovered by OpenCode automatically:

| Skill | Use it for |
| --- | --- |
| `playwright-cli` | Driving a browser from the command line: snapshots, locators, tracing, storage state |
| `security-audit` | Trust-boundary review of the app or of this test suite |
| `humanizer` | Rewriting AI-sounding prose in test plans, reports, and PR text |

To refresh the official CLI skill after a Playwright upgrade:

```bash
playwright-cli install --skills=agents
```

## Writing Tests

The project uses the **Page Object Model** and **custom fixtures**.

`pages/LoginPage.ts` (a placeholder in this template; align the locators with your app)

```typescript
import { TestPage } from "@/pages/TestPage";

export class LoginPage extends TestPage {
  async goto(): Promise<void> {
    await super.goto("/login");
  }

  get emailInput() {
    return this.getByLabel(/e-?mail/i);
  }

  get passwordInput() {
    return this.getByLabel(/password/i);
  }

  get submitButton() {
    return this.getByRole("button", { name: /sign in|log in/i });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

`fixtures/test.ts` (add fixtures here, then import `test` and `expect` from it)

```typescript
import { test as base } from "@playwright/test";
import { LoginPage } from "@/pages/LoginPage";

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from "@playwright/test";
```

`tests/features/auth/login.spec.ts`

```typescript
import { test, expect } from "@/fixtures/test";

test("01 - rejects a wrong password", async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login("demo@example.test", "wrong-password");

  await expect(page.getByRole("main")).toContainText(/invalid|incorrect/i);
});
```

### Conventions

- `tests/features/<area>/` for one screen, `tests/e2e/` for a flow across screens.
- Put page objects in `pages/`, test data in `data/`, shared helpers in `utils/`.
- Import with the `@/*` alias (`@/pages/LoginPage`, `@/fixtures/screenshot`).
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByTestId`.
- Use relative paths with `baseURL`: `page.goto("/login")`.
- Never commit `test.only` (CI fails on it via `forbidOnly`).
- Keep authentication state in `.auth/` (git-ignored), never in committed files.
- Full rules for specs: `tests/AGENTS.md`.

## Reports & Debugging

```bash
npm run test:report
```

`playwright show-report` starts a server inside the container. To view it from your host, serve it on all interfaces and open <http://localhost:9323>:

```bash
npx playwright show-report --host 0.0.0.0 --port 9323
```

Port `9323` is already published by the `playwright` service. You can also open `playwright-report/index.html` directly, since the folder is mounted to your machine.

Open the trace of a failed test:

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

## How the Docker Setup Works

| Piece | Purpose |
| --- | --- |
| `docker/Dockerfile` | Starts from the official Playwright image (browsers preinstalled at `/ms-playwright`) and installs `@playwright/cli`. Uses an npm cache mount for faster rebuilds |
| `docker/entrypoint.sh` | Runs `npm ci` on startup only when `package-lock.json` changed, and warns if `@playwright/test` does not match the image version |
| `playwright` service | Interactive shell (`bash`), publishes port `9323` for the report server |
| `test` service | One-shot `npx playwright test`, enabled with `--profile test` |
| `env_file: ../.env` | Loads `BASE_URL`, `CI`, etc. from the project root (optional file) |
| `node_modules` volume | Keeps dependencies inside Docker, separate from the host, for speed and OS compatibility |
| `npm_cache` volume | Reuses the npm download cache across `npm ci` runs |
| `..:/workspace` mount | Your source is mounted live, so host edits appear immediately |
| `ipc: host` | Prevents Chromium crashes caused by limited shared memory |
| `init: true` | Reaps zombie browser processes |
| `.dockerignore` | Allows only `docker/entrypoint.sh` into the build context, because the source is mounted at runtime |

Browsers are preinstalled in the image, so `npx playwright install` is not needed in the container.

## Git Conventions

- **Commit** `package-lock.json` (the entrypoint and `npm ci` depend on it) and `.env.example`.
- **Do not commit** `.env`, `node_modules/`, `playwright-report/`, `test-results/`, `.auth/`, `.storage/`.
- Recommended `.gitignore`:

```gitignore
node_modules/

.env
.env.*
!.env.example

playwright-report/
test-results/
blob-report/
playwright/.cache/

.auth/
.storage/

*.log
.DS_Store
```

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| `BASE_URL is required...` | `.env` is missing in the project root. Create it from `.env.example` |
| `BASE_URL` seems ignored | Run `dcp config` to see the resolved value. Check that `.env` is in the project root and the Compose version is 2.24 or newer |
| `ERR_CONNECTION_REFUSED` | App is not running or listens only on `127.0.0.1`. Bind to `0.0.0.0` and use `host.docker.internal` |
| `WARNING: @playwright/test is X but the image is Y` | Versions differ. Align `package.json` and `PLAYWRIGHT_VERSION`, then rebuild |
| `Executable doesn't exist` or browser version errors | Same cause as above |
| `npm ci` fails with a lockfile error | `package.json` and `package-lock.json` are out of sync. Run `npm install` and commit the lockfile |
| Dependencies did not update | Delete the volume: `dcp down -v`, then start again |
| Chromium crashes or hangs | Check that `ipc: host` is still in the compose file |
| `entrypoint.sh: not found` or `\r` errors | Line endings issue; the Dockerfile strips CRLF, so rebuild with `dcp build --no-cache` |
| Root-owned files on a Linux host | The container runs as root; run `sudo chown -R $USER .` on the host |
| Old `docker_playwright_node_modules` volume left over | Remove it with `docker volume rm docker_playwright_node_modules` |

## References

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright with Docker](https://playwright.dev/docs/docker)
- [Playwright Test Agents](https://playwright.dev/docs/test-agents)
- [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers)
- [Page Object Models](https://playwright.dev/docs/pom)
