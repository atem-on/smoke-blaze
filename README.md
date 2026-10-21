# Smoke Blaze

This project contains Playwright smoke tests for the Demoblaze storefront.

## Prerequisites

- Node.js 18 or newer
- npm

## Install dependencies

```bash
npm install
```

## Install Playwright

```bash
npx playwright install
```

## Run the tests

Run the full Playwright suite:

```bash
npm test
```

Run a specific file:

```bash
npx playwright test tests/smoke.spec.js
```

Run a specific browser project:

```bash
npx playwright test --project=chromium
```

## Project structure

- `tests/` - Playwright test files
- `playwright.config.js` - Playwright configuration
- `playwright/.auth/` - generated auth state for authenticated tests

## Useful commands

Open the HTML report after a test run:

```bash
npx playwright show-report
```

