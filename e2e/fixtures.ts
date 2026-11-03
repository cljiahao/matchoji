import { test as base, expect } from '@playwright/test';

declare global {
  interface Window {
    __cspViolations?: string[];
  }
}

// Every test also fails on a console error, an uncaught page error or a CSP violation, so a page
// that renders but breaks the policy (a blocked script, a tile host outside img-src) is caught.
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
      });
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
      await page.addInitScript(() => {
        window.__cspViolations = [];
        document.addEventListener('securitypolicyviolation', (event) => {
          window.__cspViolations?.push(
            `${event.violatedDirective} blocked ${event.blockedURI} (${event.sourceFile}:${event.lineNumber})`
          );
        });
      });
      await use(problems);
      const violations = await page.evaluate(() => window.__cspViolations ?? []).catch(() => []);
      expect([...problems, ...violations.map((v) => `csp: ${v}`)]).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
