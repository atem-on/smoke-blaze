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
or in ui mode

```bash
npx playwright test --ui
```
UI mode enables to run tests also without auth setup. On upper left corner click projects text and untick setup. You can also toggle used browser from this menu.

Run a specific browser project:

```bash
npx playwright test --project=chromium
```

## Project structure

- `tests/` - Playwright test files
- `playwright.config.js` - Playwright configuration
- `playwright/.auth/` - generated auth state for authenticated tests
- `utils.js` - helper file that includes functions used by tests

## Useful commands

Open the HTML report after a test run:

```bash
npx playwright show-report
```

## What is tested

    - authenticated user is loaded from storage state
    - homepage loads and shows products
    - all categories show products
    - contact form can send a message
    - user can open a product and add it to cart
    - user can add a product to cart and complete purchase

All tests are run by default with chromium, firefox and webkit(safari).

## How tests are constructed

By default tests use authentication so all tests are run with logged in user. Tests are separated to smoke.spec for smaller tests and purchase.spec that covers the whole purchase process. These spec files use different auth files to ensure that tests don't interfere each others results.

It is possible to execute smoke.spec tests (not the first) as a user that is not logged in by not using auth setup.

## What could be done as further development

- Locators could be way better but that change would have to be made in html structure
- Tests could be more dynamic by removing hard coded stuff (like shop categories)
- Credentials should come from for example pipeline secrets and test users should be removed after tests are run
- In this case I only used helper file for some functions but in real case I would use page object model or fixtures to avoid repetition and to keep spec files as clear as possible. I think that object of test automation should be that spec code in so readable that someone who does not code, could read what test is doing.
 
