const { chromium } = require('playwright-core');
const path = require('node:path');

const home = 'https://www.toastmasters.org/myhome';
const dashboard = 'https://apps.basecamp.toastmasters.org/dashboard';

function allowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'toastmasters.org' || url.hostname.endsWith('.toastmasters.org'));
  } catch { return false; }
}

function createPathways(dataDirectory) {
  let context;
  let page;
  let browserChannel;

  async function getPage(browser) {
    const channel = browser === 'Edge' ? 'msedge' : 'chrome';
    if (context && channel !== browserChannel) await context.close();
    if (!context) {
      context = await chromium.launchPersistentContext(path.join(dataDirectory, `pathways-${channel}`), { channel, headless: false });
      browserChannel = channel;
      context.on('close', () => { context = undefined; page = undefined; });
      context.setDefaultTimeout(12000);
    }
    if (!page || page.isClosed()) page = context.pages()[0] || await context.newPage();
    return page;
  }

  async function open(browser) {
    const tab = await getPage(browser);
    await tab.goto(home, { waitUntil: 'domcontentloaded' });
    await tab.bringToFront();
  }

  async function load(browser) {
    const tab = await getPage(browser);
    await tab.goto(home, { waitUntil: 'domcontentloaded' });
    const entry = tab.getByRole('button', { name: /Go to Base Camp/ });
    if (!await entry.waitFor({ state: 'visible', timeout: 9000 }).then(() => true, () => false)) throw new Error('Sign in to Toastmasters in the browser window, then click Load paths again.');
    await entry.click();
    await tab.waitForURL(url => url.hostname === 'apps.basecamp.toastmasters.org', { timeout: 20000 });
    await tab.getByRole('tab', { name: 'Paths & Learning', exact: true }).waitFor();
    return tab;
  }

  async function list(browser) {
    const tab = await load(browser);
    const cards = tab.getByRole('tabpanel').getByRole('heading', { level: 3 });
    await cards.first().waitFor({ timeout: 12000 }).catch(() => {});
    return cards.evaluateAll(headings => headings.map(heading => ({ name: heading.textContent.trim(), status: heading.closest('button')?.innerText.split('\n').find(text => /^(in progress|completed|registered)$/i.test(text.trim())) || '' })).filter(item => item.name));
  }

  async function pathOutline(browser, name) {
    const tab = await load(browser);
    const card = tab.getByRole('button').filter({ has: tab.getByRole('heading', { name, exact: true }) });
    if (await card.count() !== 1) throw new Error('Select a path listed in the signed-in account.');
    await card.click();
    const breadcrumb = tab.getByRole('navigation', { name: 'breadcrumb' }).getByRole('link', { name, exact: true });
    const outline = tab.getByRole('button', { name: 'Expand all', exact: true });
    await Promise.race([breadcrumb.waitFor(), outline.waitFor()]);
    if (!await outline.isVisible() && await breadcrumb.isVisible()) await breadcrumb.click();
    await outline.waitFor({ timeout: 16000 });
    await outline.click();
    return tab;
  }

  async function progress(browser, name) {
    const tab = await pathOutline(browser, name);
    const labels = await tab.getByRole('main').locator('a, button').evaluateAll(elements => elements.map(element => (element.getAttribute('aria-label') || element.innerText).trim()).filter(label => /,\s*(incomplete|complete|completed|in progress|not started)/i.test(label)));
    return labels;
  }

  async function resources(browser, name, project) {
    const tab = await pathOutline(browser, name);
    const links = tab.getByRole('main').getByRole('link').filter({ hasText: project });
    const matches = [];
    for (const link of await links.all()) {
      if ((await link.innerText()).trim() === project) matches.push(link);
    }
    if (matches.length !== 1) throw new Error('Enter the exact project title from the progress list.');
    await matches[0].click();
    const frame = tab.frameLocator('iframe#unit-iframe');
    await frame.getByRole('heading', { name: 'Resources', exact: true }).waitFor({ timeout: 18000 }).catch(() => {});
    const resources = await frame.getByRole('link').evaluateAll(links => links.map(link => ({ title: link.innerText.trim(), url: link.href })).filter(link => /evaluation resource|evaluation form|print the|worksheet|checklist|project pdf/i.test(link.title)));
    return resources.filter(link => allowedUrl(link.url));
  }

  async function show(browser, value) {
    if (!allowedUrl(value)) throw new Error('Only verified Toastmasters resource URLs can be opened here.');
    await getPage(browser);
    const resource = await context.newPage();
    await resource.goto(value, { waitUntil: 'domcontentloaded' });
    await resource.bringToFront();
  }

  async function pdf(browser, value) {
    await getPage(browser);
    for (let redirects = 0; redirects < 5; redirects++) {
      if (!allowedUrl(value)) throw new Error('Only Toastmasters resource URLs can be saved.');
      const response = await context.request.get(value, { maxRedirects: 0, timeout: 20000 });
      try {
        const headers = response.headers();
        if (response.status() >= 300 && response.status() < 400 && headers.location) { value = new URL(headers.location, value).href; continue; }
        if (!response.ok()) throw new Error('Open the resource in your signed-in browser first.');
        if (Number(headers['content-length']) > 20000000) throw new Error('This resource exceeds the 20 MB download limit.');
        const bytes = await response.body();
        if (bytes.length > 20000000 || bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('This link did not return a PDF under 20 MB. Open it in the browser to view or print it.');
        return bytes;
      } finally { await response.dispose(); }
    }
    throw new Error('Too many resource redirects. Open it in the browser.');
  }

  return { open, list, progress, resources, show, pdf, dashboard, async close() { await context?.close(); } };
}

module.exports = { createPathways };
