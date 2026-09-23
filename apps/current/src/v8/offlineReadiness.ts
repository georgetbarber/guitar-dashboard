/** The selected unit uses bundled curriculum and synthesised sounds. */
function shellAssets(html: string, base: string): string[] {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return [
    ...parsed.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
      'script[type="module"][src], link[rel="stylesheet"][href], link[rel="modulepreload"][href]',
    ),
  ]
    .map((element) => new URL(element.getAttribute("src") ?? element.getAttribute("href")!, base).href)
    .sort();
}

/** Require the same installed shell as the page, not merely any old cache. */
export async function shellCachedForPage(storage: CacheStorage, pageHtml: string, origin: string): Promise<boolean> {
  const assets = shellAssets(pageHtml, origin);
  if (!assets.length) return false;
  const indexUrl = new URL("/index.html", origin).href;
  for (const name of await storage.keys()) {
    if (!name.includes("precache")) continue;
    const cache = await storage.open(name);
    const index = await cache.match(indexUrl, { ignoreSearch: true });
    if (!index) continue;
    if (JSON.stringify(shellAssets(await index.text(), origin)) !== JSON.stringify(assets)) continue;
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
