const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");
const hrefs = (root: ParentNode, selector: string, base: string) =>
  [...root.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(selector)]
    .map((element) => new URL(element.getAttribute("src") ?? element.getAttribute("href")!, base).href)
    .sort();

/** The selected unit uses bundled curriculum and synthesised sounds. */
function shellAssets(root: ParentNode, base: string): string[] {
  return hrefs(root, 'script[type="module"][src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]', base);
}

/**
 * The build's entry script. It names the build the page is running, and the
 * bundler never adds one at run time — unlike the stylesheet and modulepreload
 * links it inserts whenever a lazy chunk (account code, a view) loads.
 */
function entryScripts(root: ParentNode, base: string): string[] {
  return hrefs(root, 'script[type="module"][src]', base);
}

/** Require the same installed shell as the page, not merely any old cache. */
export async function shellCachedForPage(storage: CacheStorage, pageHtml: string, origin: string): Promise<boolean> {
  const entries = entryScripts(parse(pageHtml), origin);
  if (!entries.length) return false;
  const indexUrl = new URL("/index.html", origin).href;
  for (const name of await storage.keys()) {
    if (!name.includes("precache")) continue;
    const cache = await storage.open(name);
    const index = await cache.match(indexUrl, { ignoreSearch: true });
    if (!index) continue;
    const cached = parse(await index.text());
    if (JSON.stringify(entryScripts(cached, origin)) !== JSON.stringify(entries)) continue;
    const assets = shellAssets(cached, origin);
    if ((await Promise.all(assets.map((url) => cache.match(url, { ignoreSearch: true })))).every(Boolean)) return true;
  }
  return false;
}

export async function selectedLessonReadyOffline(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) return false;
    return await shellCachedForPage(window.caches, document.documentElement.outerHTML, location.origin);
  } catch {
    return false;
  }
}
