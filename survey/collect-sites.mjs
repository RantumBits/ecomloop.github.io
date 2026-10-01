// Step 0 collector: real local business websites from OpenStreetMap via Overpass.
// Output: survey/sites.json  [{host, url, name, category, metro}]
// Bias to note: OSM website= tags skew toward businesses someone bothered to map.
import { writeFileSync } from 'node:fs';

const UA = 'ecomloop-step0-survey/0.1 (research; drewf77@gmail.com)';
const METROS = {
  'Boise ID':        [43.45, -116.45, 43.75, -116.05],
  'Asheville NC':    [35.45,  -82.70, 35.70,  -82.40],
  'Tucson AZ':       [32.00, -111.10, 32.40, -110.70],
  'Grand Rapids MI': [42.80,  -85.80, 43.10,  -85.50],
  'Chattanooga TN':  [34.95,  -85.40, 35.20,  -85.10],
  'Spokane WA':      [47.55, -117.55, 47.80, -117.25],
  'Richmond VA':     [37.40,  -77.65, 37.70,  -77.30],
  'Omaha NE':        [41.15,  -96.25, 41.40,  -95.85],
  'Fresno CA':       [36.65, -119.95, 36.90, -119.60],
  'Albany NY':       [42.60,  -73.90, 42.80,  -73.65],
  'Portland ME':     [43.60,  -70.40, 43.75,  -70.20],
  'Bend OR':         [43.95, -121.40, 44.15, -121.20],
  'Medford OR':      [42.15, -122.95, 42.45, -122.70],
  'Columbus OH':     [39.90,  -83.15, 40.10,  -82.85],
  'Raleigh NC':      [35.70,  -78.75, 35.90,  -78.50],
  'Sacramento CA':   [38.50, -121.60, 38.70, -121.30],
};
const CATS = [
  ['craft','plumber'],['craft','electrician'],['craft','hvac'],['craft','roofer'],
  ['craft','painter'],['craft','carpenter'],
  ['amenity','dentist'],['amenity','veterinary'],['amenity','doctors'],['healthcare','physiotherapist'],
  ['shop','hairdresser'],['shop','beauty'],['shop','car_repair'],['shop','florist'],
  ['shop','bakery'],['shop','pet'],['shop','bicycle'],['shop','optician'],
  ['amenity','restaurant'],['amenity','cafe'],
  ['office','lawyer'],['office','accountant'],['office','insurance'],
  ['leisure','fitness_centre'],
];
const CAP_PER_CAT = 40;
const DROP_HOSTS = /(facebook|instagram|yelp|google|linkedin|twitter|x\.com|tiktok|nextdoor|doordash|grubhub|ubereats|toasttab|squareup|square\.site|linktr|bit\.ly|yellowpages|angi|homeadvisor|thumbtack|zocdoc|healthgrades|vagaro|booksy|styleseat|schedulicity|mindbodyonline|wixsite\.com|godaddysites\.com|business\.site)/i;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function overpass(bbox) {
  const [s,w,n,e] = bbox;
  const body = CATS.map(([k,v]) => `nwr["${k}"="${v}"]["website"](${s},${w},${n},${e});`).join('\n');
  const q = `[out:json][timeout:90];(\n${body}\n);out tags;`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: {'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'data=' + encodeURIComponent(q),
    });
    if (r.status === 200) return (await r.json()).elements;
    console.error(`  overpass ${r.status}, retry ${attempt+1}`); await sleep(15000);
  }
  return [];
}

function hostOf(u) {
  try { const h = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u).hostname.toLowerCase().replace(/^www\./,''); return h.includes('.') ? h : null; } catch { return null; }
}

const rows = [];
for (const [metro, bbox] of Object.entries(METROS)) {
  const els = await overpass(bbox);
  let n = 0;
  for (const el of els) {
    const t = el.tags || {}; const site = (t.website || '').split(';')[0].trim();
    const host = hostOf(site); if (!host || DROP_HOSTS.test(host)) continue;
    const cat = CATS.find(([k,v]) => t[k] === v); if (!cat) continue;
    rows.push({ host, url: /^https?:\/\//i.test(site) ? site : 'https://' + site, name: t.name || '', category: cat[1], metro });
    n++;
  }
  console.error(`${metro}: ${els.length} elements, ${n} with usable website`);
  await sleep(3000);
}

// chain heuristic: a host appearing in >1 metro is not a single local business
const metrosByHost = new Map();
for (const r of rows) metrosByHost.set(r.host, (metrosByHost.get(r.host) || new Set()).add(r.metro));
const seen = new Set(), perCat = {}, out = [];
for (const r of rows.sort(() => Math.random() - 0.5)) {
  if (metrosByHost.get(r.host).size > 1) continue;
  if (seen.has(r.host)) continue;
  if ((perCat[r.category] || 0) >= CAP_PER_CAT) continue;
  seen.add(r.host); perCat[r.category] = (perCat[r.category] || 0) + 1; out.push(r);
}
writeFileSync('survey/sites.json', JSON.stringify(out, null, 1));
console.error(`\n${rows.length} raw rows -> ${out.length} unique single-metro hosts`);
console.error(Object.entries(perCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join('  '));
