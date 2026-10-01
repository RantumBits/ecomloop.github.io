// Step 0 survey. Input survey/sites.json, output survey/results.jsonl (one raw record per site).
// Pure measurement; classification happens in analyze.mjs so it can be re-run offline.
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';

const CONCURRENCY = 16, TIMEOUT_MS = 12000, BODY_CAP = 2_000_000;
const UAS = {
  chrome:   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  googlebot:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36',
  oaisearch:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  chatgptuser:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  perplexity:'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  gptbot:   'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
};
const TOKENS = {
  training: ['gptbot','claudebot','google-extended','applebot-extended','meta-externalagent','ccbot','bytespider','amazonbot','anthropic-ai'],
  citation: ['oai-searchbot','perplexitybot','claude-searchbot'],
  userfetch:['chatgpt-user','claude-user','perplexity-user'],
};
const LB_TYPES = new Set(['LocalBusiness','AnimalShelter','ArchiveOrganization','AutomotiveBusiness','AutoBodyShop','AutoDealer','AutoPartsStore','AutoRental','AutoRepair','AutoWash','GasStation','MotorcycleDealer','MotorcycleRepair','ChildCare','Dentist','DryCleaningOrLaundry','EmergencyService','FireStation','Hospital','PoliceStation','EmploymentAgency','EntertainmentBusiness','AdultEntertainment','AmusementPark','ArtGallery','Casino','ComedyClub','MovieTheater','NightClub','FinancialService','AccountingService','AutomatedTeller','BankOrCreditUnion','InsuranceAgency','FoodEstablishment','Bakery','BarOrPub','Brewery','CafeOrCoffeeShop','Distillery','FastFoodRestaurant','IceCreamShop','Restaurant','Winery','GovernmentOffice','PostOffice','HealthAndBeautyBusiness','BeautySalon','DaySpa','HairSalon','HealthClub','NailSalon','TattooParlor','HomeAndConstructionBusiness','Electrician','GeneralContractor','HVACBusiness','HousePainter','Locksmith','MovingCompany','Plumber','RoofingContractor','InternetCafe','LegalService','Attorney','Notary','Library','LodgingBusiness','BedAndBreakfast','Campground','Hostel','Hotel','Motel','Resort','MedicalBusiness','CommunityHealth','Dermatology','DietNutrition','Emergency','Geriatric','Gynecologic','MedicalClinic','Midwifery','Nursing','Obstetric','Oncologic','Optician','Optometric','Otolaryngologic','Pediatric','Pharmacy','Physician','Physiotherapy','PlasticSurgery','Podiatric','PrimaryCare','Psychiatric','PublicHealth','ProfessionalService','RadioStation','RealEstateAgent','RecyclingCenter','SelfStorage','ShoppingCenter','SportsActivityLocation','BowlingAlley','ExerciseGym','GolfCourse','PublicSwimmingPool','SkiResort','SportsClub','StadiumOrArena','TennisComplex','Store','BikeStore','BookStore','ClothingStore','ComputerStore','ConvenienceStore','DepartmentStore','ElectronicsStore','Florist','FurnitureStore','GardenStore','GroceryStore','HardwareStore','HobbyShop','HomeGoodsStore','JewelryStore','LiquorStore','MensClothingStore','MobilePhoneStore','MovieRentalStore','MusicStore','OfficeEquipmentStore','OutletStore','PawnShop','PetStore','ShoeStore','SportingGoodsStore','TireShop','ToyStore','WholesaleStore','TelevisionStation','TouristInformationCenter','TravelAgency','VeterinaryCare']);
const BUILDERS = [
  ['squarespace', /static1\.squarespace\.com|squarespace\.com\/|Squarespace/i],
  ['wix',         /static\.wixstatic\.com|static\.parastorage\.com|wix\.com/i],
  ['godaddy',     /img1\.wsimg\.com|godaddy/i],
  ['wordpress',   /\/wp-content\/|\/wp-includes\//i],
  ['shopify',     /cdn\.shopify\.com/i],
  ['weebly',      /weebly\.com|editmysite\.com/i],
  ['duda',        /cdn-website\.com|dudamobile/i],
  ['webflow',     /assets(-global)?\.website-files\.com|webflow\.io/i],
  ['hibu',        /hibu/i],
  ['thryv',       /thryv|sitewrench/i],
];

const sleepless = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

async function get(url, ua, wantBody) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { 'User-Agent': ua, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    const h = Object.fromEntries([...r.headers.entries()]);
    let body = '';
    if (wantBody || r.status !== 200) { body = (await sleepless(r.text(), TIMEOUT_MS)).slice(0, BODY_CAP); }
    else { const t = await sleepless(r.text(), TIMEOUT_MS); body = t.slice(0, BODY_CAP); }
    const challenge = h['cf-mitigated'] === 'challenge' || /cf-chl|Just a moment\.\.\.|Attention Required! \| Cloudflare|_cf_chl_opt|challenge-platform/i.test(body.slice(0, 20000));
    return { status: r.status, finalUrl: r.url, server: h['server'] || null, cfRay: !!h['cf-ray'], cfMitigated: h['cf-mitigated'] || null, xRobots: h['x-robots-tag'] || null, contentType: h['content-type'] || null, len: body.length, challenge, ms: Date.now() - t0, body: wantBody ? body : undefined };
  } catch (e) { return { error: (e.cause && e.cause.code) || e.name || String(e.message).slice(0, 80), ms: Date.now() - t0 }; }
}

function parseRobots(txt) {
  const groups = []; let cur = null;
  for (let raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!cur || cur.rules.length) { cur = { uas: [], rules: [] }; groups.push(cur); } cur.uas.push(v.toLowerCase()); }
    else if ((k === 'disallow' || k === 'allow') && cur) cur.rules.push([k, v]);
  }
  const groupFor = tok => groups.find(g => g.uas.includes(tok)) || groups.find(g => g.uas.includes('*')) || null;
  const rootBlocked = g => !!g && g.rules.some(([k, v]) => k === 'disallow' && v === '/') && !g.rules.some(([k, v]) => k === 'allow' && v === '/');
  const out = { hasGroups: groups.length > 0, starDisallowAll: rootBlocked(groups.find(g => g.uas.includes('*')) || null), blocked: {} };
  for (const [cls, toks] of Object.entries(TOKENS)) out.blocked[cls] = toks.filter(t => { const g = groupFor(t); return g && g.uas.includes(t) ? rootBlocked(g) : (g && rootBlocked(g)); });
  // explicit = named in its own group (not inherited from *)
  out.explicitlyNamed = Object.values(TOKENS).flat().filter(t => groups.some(g => g.uas.includes(t)));
  return out;
}

function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
}
const PHONE = /(?<!\d)(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;
const ADDR = /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?[A-Z][A-Za-z0-9.'-]*(?:\s+[A-Z][A-Za-z0-9.'-]*){0,3}\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Pkwy|Parkway|Hwy|Highway|Pl|Place|Cir|Circle|Ter|Terrace|Trl|Trail|Loop|Sq|Square)\b/;
const STATEZIP = /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+\d{5}(?:-\d{4})?\b/;
const DAY = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day|nesday|rsday|urday|s)?\b/i;
const TIME = /\b\d{1,2}(?::\d{2})?\s?(?:am|pm|a\.m\.|p\.m\.)\b/i;

function jsonld(html) {
  const blocks = [...html.matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  let parseErrors = 0; const ents = [];
  const walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return; if (o['@graph']) walk(o['@graph']); if (o['@type']) ents.push(o); for (const k of ['mainEntity','mainEntityOfPage','publisher','provider','itemListElement']) if (o[k] && typeof o[k] === 'object') walk(o[k]); };
  for (const b of blocks) { try { walk(JSON.parse(b.trim())); } catch { parseErrors++; } }
  const types = o => [].concat(o['@type']).map(String);
  const lb = ents.filter(o => types(o).some(t => LB_TYPES.has(t)));
  const norm = s => String(s || '').toLowerCase().replace(/\D/g, '');
  const addrStr = o => { const a = o.address; if (!a) return ''; if (typeof a === 'string') return a.toLowerCase().replace(/\s+/g, ' ').trim(); return [a.streetAddress, a.addressLocality, a.postalCode].filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, ' ').trim(); };
  const phones = new Set(lb.map(o => norm(o.telephone)).filter(x => x.length >= 10)), addrs = new Set(lb.map(addrStr).filter(Boolean));
  return {
    blocks: blocks.length, parseErrors, entities: ents.length, lbCount: lb.length, lbTypes: [...new Set(lb.flatMap(types))].slice(0, 6),
    hasOrganization: ents.some(o => types(o).includes('Organization')),
    conflicting: lb.length >= 2 && (phones.size > 1 || addrs.size > 1),
    lbFields: lb[0] ? { telephone: !!lb[0].telephone, addressIsObject: !!lb[0].address && typeof lb[0].address === 'object', addressIsString: typeof lb[0].address === 'string', geo: !!lb[0].geo, hours: !!(lb[0].openingHoursSpecification || lb[0].openingHours), url: !!lb[0].url, image: !!lb[0].image, sameAs: !!lb[0].sameAs } : null,
  };
}

async function survey(site) {
  const rec = { ...site, at: new Date().toISOString() };
  const chrome = await get(site.url, UAS.chrome, true);
  rec.chrome = { ...chrome, body: undefined };
  if (chrome.body) {
    const html = chrome.body, text = visibleText(html);
    rec.html = {
      https: /^https:/.test(chrome.finalUrl || ''), finalHost: (() => { try { return new URL(chrome.finalUrl).hostname.replace(/^www\./, ''); } catch { return null; } })(),
      title: /<title[^>]*>\s*\S/i.test(html), metaDesc: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i.test(html),
      noindex: /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html) || /noindex/i.test(chrome.xRobots || ''),
      viewport: /<meta[^>]+name=["']viewport["']/i.test(html),
      telLink: /href\s*=\s*["']tel:/i.test(html),
      phoneVisible: PHONE.test(text), phoneAnywhere: PHONE.test(html),
      addrVisible: ADDR.test(text) || STATEZIP.test(text), addrStreetVisible: ADDR.test(text),
      hoursVisible: DAY.test(text) && TIME.test(text),
      textLen: text.length,
      builder: (BUILDERS.find(([, re]) => re.test(html) || re.test(chrome.server || '')) || ['other'])[0],
      jsonld: jsonld(html),
    };
  }
  rec.googlebot = await get(site.url, UAS.googlebot, false);
  rec.ai = {};
  for (const k of ['oaisearch', 'chatgptuser', 'perplexity', 'gptbot']) rec.ai[k] = await get(site.url, UAS[k], false);
  let origin; try { origin = new URL(chrome.finalUrl || site.url).origin; } catch { origin = site.url.replace(/\/.*$/, ''); }
  const rob = await get(origin + '/robots.txt', UAS.chrome, true);
  rec.robots = { status: rob.status, error: rob.error, isHtml: /text\/html/i.test(rob.contentType || '') || /^\s*<(!doctype|html)/i.test(rob.body || ''), ...(rob.body && rob.status === 200 ? parseRobots(rob.body) : {}) };
  return rec;
}

const sites = JSON.parse(readFileSync('survey/sites.json', 'utf8'));
writeFileSync('survey/results.jsonl', '');
let i = 0, done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (i < sites.length) {
    const s = sites[i++];
    const rec = await survey(s);
    appendFileSync('survey/results.jsonl', JSON.stringify(rec) + '\n');
    if (++done % 50 === 0) console.error(`${done}/${sites.length}  ${((Date.now() - t0) / 1000) | 0}s`);
  }
}));
console.error(`done ${done} in ${((Date.now() - t0) / 1000) | 0}s`);
