// Discoverability pre-check on the 10 fixture brands from the tracking-scanner spec.
// robots.txt AI tokens, two-control edge test, /products.json, Product JSON-LD completeness, review app.
const STORES = ['chamberlaincoffee.com','crownaffair.com','fairharborclothing.com','livemomentous.com','nativepet.com','sunski.com','coppercowcoffee.com','brightland.co','foursigmatic.com','getmaude.com'];
const UAS = {
  chrome:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  googlebot:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36',
  oaisearch:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  chatgptuser:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  perplexity:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  gptbot:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
};
const AI_TOKENS = ['gptbot','oai-searchbot','chatgpt-user','claudebot','claude-searchbot','claude-user','perplexitybot','perplexity-user','google-extended','ccbot','bytespider','amazonbot','anthropic-ai'];
const REVIEW_APPS = [['judge.me',/judge\.me|judgeme/i],['yotpo',/yotpo/i],['okendo',/okendo/i],['stamped',/stamped\.io/i],['loox',/loox\.io/i],['reviews.io',/reviews\.io/i],['junip',/junip/i],['trustpilot',/trustpilot/i]];
const get = async (url, ua) => { try { const r = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'text/html,application/json,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(15000) }); const body = await r.text(); return { status: r.status, server: r.headers.get('server'), cf: !!r.headers.get('cf-ray'), shopId: r.headers.get('x-shopid'), body, challenge: /cf-chl|Just a moment\.\.\.|Attention Required!/i.test(body.slice(0, 20000)) }; } catch (e) { return { error: (e.cause && e.cause.code) || e.name }; } };
const ok = f => f && !f.error && f.status === 200 && !f.challenge;
const ref = f => f && !f.error && ([401, 403, 406, 429, 503].includes(f.status) || f.challenge);
const ents = html => { const out = []; for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) { try { const walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return; if (o['@graph']) walk(o['@graph']); if (o['@type']) out.push(o); }; walk(JSON.parse(m[1].trim())); } catch {} } return out; };

const rows = [];
for (const host of STORES) {
  const base = 'https://' + host;
  const [chrome, gb, oai, cgu, ppx, gpt, rob, pj] = await Promise.all([get(base + '/', UAS.chrome), get(base + '/', UAS.googlebot), get(base + '/', UAS.oaisearch), get(base + '/', UAS.chatgptuser), get(base + '/', UAS.perplexity), get(base + '/', UAS.gptbot), get(base + '/robots.txt', UAS.chrome), get(base + '/products.json?limit=250', UAS.chrome)]);
  const r = { host, shopify: !!(chrome.shopId || /cdn\.shopify\.com/.test(chrome.body || '')), cf: chrome.cf, controls: ok(chrome) && ok(gb) };
  r.edge = { oai: ref(oai), cgu: ref(cgu), ppx: ref(ppx), gpt: ref(gpt) };
  const rtxt = ok(rob) ? rob.body : '';
  r.robotsNamesAI = AI_TOKENS.filter(t => new RegExp('user-agent:\\s*' + t.replace('-', '\\-') + '\\b', 'i').test(rtxt));
  r.robotsCustom = /robots\.txt\.liquid|# custom|^\s*#.*(?:custom|added)/im.test(rtxt) || r.robotsNamesAI.length > 0;
  let products = []; try { products = JSON.parse(pj.body || '{}').products || []; } catch {}
  r.productsJson = ok(pj) ? products.length : (pj.status || pj.error);
  r.productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))].slice(0, 5);
  // first product page
  const first = products.find(p => p.variants?.some(v => v.available)) || products[0];
  if (first) {
    const pp = await get(`${base}/products/${first.handle}`, UAS.chrome);
    const es = ents(pp.body || '');
    const prod = es.find(e => [].concat(e['@type']).includes('Product')) || es.find(e => [].concat(e['@type']).includes('ProductGroup'));
    const offers = prod ? [].concat(prod.offers || prod.hasVariant?.[0]?.offers || []) : [];
    const o = offers[0] || {};
    r.product = prod ? { type: [].concat(prod['@type']).join('/'), brand: !!prod.brand, gtin: !!(prod.gtin || prod.gtin13 || prod.gtin12 || prod.gtin14 || prod.mpn || prod.sku), image: !!prod.image, description: !!prod.description, offersN: offers.length, price: !!(o.price || o.lowPrice), currency: !!o.priceCurrency, availability: o.availability ? String(o.availability).split('/').pop() : null, aggregateRating: !!prod.aggregateRating, reviewCount: prod.aggregateRating?.reviewCount ?? prod.aggregateRating?.ratingCount ?? null, ratingValue: prod.aggregateRating?.ratingValue ?? null } : null;
    r.availabilityMatch = r.product?.availability && first.variants ? ((/InStock/i.test(r.product.availability)) === first.variants.some(v => v.available)) : null;
    r.reviewApp = (REVIEW_APPS.find(([, re]) => re.test(pp.body || '')) || ['none'])[0];
    r.productSchemaCount = es.filter(e => [].concat(e['@type']).includes('Product')).length;
  }
  rows.push(r);
  console.error(`${host}: shopify=${r.shopify} controls=${r.controls} edge=${JSON.stringify(r.edge)} robotsAI=[${r.robotsNamesAI}] products=${r.productsJson} schema=${r.product ? r.product.type : 'NONE'} rating=${r.product?.ratingValue ?? '-'}/${r.product?.reviewCount ?? '-'} app=${r.reviewApp} availMatch=${r.availabilityMatch}`);
}
console.log(JSON.stringify(rows, null, 1));
