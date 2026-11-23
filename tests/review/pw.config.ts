import base from '../../playwright.config';
const root = process.cwd(); // run from the repo root
export default {
  ...base,
  testDir: '.',
  webServer: { ...(base.webServer as object), cwd: root },
  projects: [{ name: 'review', use: { viewport: { width: 1440, height: 900 }, launchOptions: { executablePath: '/usr/bin/google-chrome' } } }],
};
