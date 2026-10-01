// Step 0 analysis over survey/results.jsonl. Prints markdown. Re-runnable offline.
import { readFileSync } from 'node:fs';
const R = readFileSync('survey/results.jsonl', 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const REFUSED = new Set([401, 403, 406, 418, 429, 451, 503]);
const served  = f => f && !f.error && f.status >= 200 && f.status < 300 && !f.challenge;
const refused = f => f && !f.error && (REFUSED.has(f.status) || f.challenge);
const pct = (n, d) => d ? `${n} (${(100 * n / d).toFixed(1)}%)` : `${n} (–)`;
const cf = r => !!(r.chrome && (r.chrome.cfRay || /cloudflare/i.test(r.chrome.server || '')));

// --- population
const total = R.length;
const reach = R.filter(r => served(r.chrome) && r.html);
const unreachable = R.filter(r => !served(r.chrome));
const unreachWhy = {}; for (const r of unreachable) { const k = r.chrome.error ? `error:${r.chrome.error}` : r.chrome.challenge ? 'challenge' : `http ${r.chrome.status}`; unreachWhy[k] = (unreachWhy[k] || 0) + 1; }
const controls = R.filter(r => served(r.chrome) && served(r.googlebot));

// --- edge, two-control
const edge = {}; for (const k of ['oaisearch', 'chatgptuser', 'perplexity', 'gptbot']) edge[k] = controls.filter(r => refused(r.ai[k]));
const anyCitationEdge = controls.filter(r => ['oaisearch', 'chatgptuser', 'perplexity'].some(k => refused(r.ai[k])));
const trainingOnlyEdge = controls.filter(r => refused(r.ai.gptbot) && !['oaisearch', 'chatgptuser', 'perplexity'].some(k => refused(r.ai[k])));
const cfSites = R.filter(cf), cfControls = controls.filter(cf);
const citEdgeCf = anyCitationEdge.filter(cf);

// --- robots
const robOk = R.filter(r => r.robots && r.robots.status === 200 && !r.robots.isHtml && r.robots.hasGroups !== undefined);
const robMissing = R.filter(r => r.robots && (r.robots.status === 404 || r.robots.error));
const robHtml = R.filter(r => r.robots && r.robots.status === 200 && r.robots.isHtml);
const rb = cls => robOk.filter(r => (r.robots.blocked?.[cls] || []).length);
const rbExplicit = cls => robOk.filter(r => (r.robots.blocked?.[cls] || []).some(t => (r.robots.explicitlyNamed || []).includes(t)));
const starAll = robOk.filter(r => r.robots.starDisallowAll);

// --- raw html
const h = f => reach.filter(r => f(r.html));
const noPhoneAnywhere = h(x => !x.phoneAnywhere && !x.telLink);
const noPhoneVisible  = h(x => !x.phoneVisible);
const noTel           = h(x => !x.telLink);
const noAddr          = h(x => !x.addrVisible);
const noHours         = h(x => !x.hoursVisible);
const noindex         = h(x => x.noindex);
const notHttps        = h(x => !x.https);
// --- schema
const lb1 = h(x => x.jsonld.lbCount >= 1), lb2 = h(x => x.jsonld.lbCount >= 2), conflict = h(x => x.jsonld.conflicting), ldErr = h(x => x.jsonld.parseErrors > 0);
const lbf = k => reach.filter(r => r.html.jsonld.lbFields && r.html.jsonld.lbFields[k]);
// --- builders
const builders = {}; for (const r of reach) builders[r.html.builder] = (builders[r.html.builder] || 0) + 1;

// --- composite (kill threshold). Site counts if ANY of: citation bot blocked (robots certain OR edge two-control), phone absent from raw HTML, conflicting schema.
const citRobots = new Set(rb('citation').concat(rb('userfetch')).map(r => r.host));
const citEdge = new Set(anyCitationEdge.map(r => r.host));
const defects = r => ({
  citationBlock: citRobots.has(r.host) || citEdge.has(r.host),
  phoneAbsent: r.html ? (!r.html.phoneAnywhere && !r.html.telLink) : false,
  conflictingSchema: r.html ? r.html.jsonld.conflicting : false,
});
const composite = reach.filter(r => Object.values(defects(r)).some(Boolean));
const compositeWide = reach.filter(r => { const d = defects(r); return d.citationBlock || d.phoneAbsent || d.conflictingSchema || !r.html.phoneVisible || r.html.jsonld.lbCount === 0; });

const byCat = {}; for (const r of reach) { const c = byCat[r.category] ||= { n: 0, cit: 0, phone: 0, conf: 0, any: 0, noLb: 0 }; c.n++; const d = defects(r); c.cit += d.citationBlock; c.phone += d.phoneAbsent; c.conf += d.conflictingSchema; c.any += Object.values(d).some(Boolean); c.noLb += r.html.jsonld.lbCount === 0; }
const byBuilder = {}; for (const r of reach) { const c = byBuilder[r.html.builder] ||= { n: 0, cit: 0, phone: 0, conf: 0, any: 0, noLb: 0, cf: 0 }; c.n++; const d = defects(r); c.cit += d.citationBlock; c.phone += d.phoneAbsent; c.conf += d.conflictingSchema; c.any += Object.values(d).some(Boolean); c.noLb += r.html.jsonld.lbCount === 0; c.cf += cf(r); }

const ex = (arr, n = 6) => arr.slice(0, n).map(r => r.host).join(', ');
const row = (label, arr, denom) => `| ${label} | ${pct(arr.length, denom)} |`;

console.log(`# Step 0 results — ${new Date().toISOString().slice(0, 10)}

Source: OpenStreetMap \`website=*\` tags, 24 categories × 16 US metros, single-metro hosts only (chain heuristic), ≤40 per category. Measured from a residential US IP, one pass, six UAs per site. Classification per \`survey/analyze.mjs\`; raw records in \`survey/results.jsonl\`.

## Population

| | |
|---|---|
| Sites surveyed | ${total} |
| Reachable to a normal Chrome UA (denominator for HTML checks) | ${pct(reach.length, total)} |
| Both controls served (Chrome + Googlebot; denominator for edge checks) | ${pct(controls.length, total)} |
| Cloudflare-fronted (any \`cf-ray\` / \`server: cloudflare\`) | ${pct(cfSites.length, total)} |

Unreachable breakdown: ${Object.entries(unreachWhy).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('; ') || 'none'}.

## Kill-threshold composite

Share of reachable sites with **at least one** of {citation/user-fetch bot blocked (robots.txt certain, or edge two-control), phone absent from raw HTML (no digits match and no \`tel:\` link), conflicting LocalBusiness schema}:

| Definition | Share |
|---|---|
${row('**Strict composite (the spec\'s threshold)**', composite, reach.length)}
${row('Wide composite (adds: phone not in visible text; no LocalBusiness schema at all)', compositeWide, reach.length)}

Thresholds written in the spec: <10% stop, ≥25% build, between: read fixtures and decide.

Components, each over the reachable set:

| Defect | Share | Examples |
|---|---|---|
| Citation/user-fetch bot blocked (robots or edge) | ${pct(reach.filter(r => defects(r).citationBlock).length, reach.length)} | ${ex(reach.filter(r => defects(r).citationBlock))} |
| Phone absent from raw HTML | ${pct(noPhoneAnywhere.length, reach.length)} | ${ex(noPhoneAnywhere)} |
| Conflicting LocalBusiness schema | ${pct(conflict.length, reach.length)} | ${ex(conflict)} |

## A1 — AI agent access

### Edge, two-control method (denominator: both controls served, n=${controls.length})

| UA | Refused while both controls served | Of which Cloudflare-fronted |
|---|---|---|
| OAI-SearchBot (citation) | ${pct(edge.oaisearch.length, controls.length)} | ${edge.oaisearch.filter(cf).length} |
| ChatGPT-User (user fetch) | ${pct(edge.chatgptuser.length, controls.length)} | ${edge.chatgptuser.filter(cf).length} |
| PerplexityBot (citation) | ${pct(edge.perplexity.length, controls.length)} | ${edge.perplexity.filter(cf).length} |
| GPTBot (training, reference) | ${pct(edge.gptbot.length, controls.length)} | ${edge.gptbot.filter(cf).length} |
| **Any citation/user-fetch bot refused** | **${pct(anyCitationEdge.length, controls.length)}** | ${citEdgeCf.length} |
| Training-only block (GPTBot refused, citation bots served) | ${pct(trainingOnlyEdge.length, controls.length)} | ${trainingOnlyEdge.filter(cf).length} |

Cloudflare-fronted sites with both controls served: ${cfControls.length}. Of those, refusing any citation bot: ${pct(cfControls.filter(r => citEdge.has(r.host)).length, cfControls.length)}. Non-Cloudflare sites refusing any citation bot: ${pct(anyCitationEdge.filter(r => !cf(r)).length, controls.length - cfControls.length)}.

Examples, any citation bot refused at edge: ${ex(anyCitationEdge, 12)}

### robots.txt (denominator: valid robots.txt served, n=${robOk.length})

| | Share |
|---|---|
${row('robots.txt missing / unreachable', robMissing, total)}
${row('robots.txt returns HTML (soft 404)', robHtml, total)}
${row('`Disallow: /` under `*`', starAll, robOk.length)}
${row('Citation bots blocked (any path, incl. inherited from `*`)', rb('citation'), robOk.length)}
${row('Citation bots blocked, token named explicitly', rbExplicit('citation'), robOk.length)}
${row('User-fetch bots blocked (any path)', rb('userfetch'), robOk.length)}
${row('User-fetch bots blocked, token named explicitly', rbExplicit('userfetch'), robOk.length)}
${row('Training bots blocked (any path)', rb('training'), robOk.length)}
${row('Training bots blocked, token named explicitly', rbExplicit('training'), robOk.length)}

Examples, citation token named and blocked in robots.txt: ${ex(rbExplicit('citation'))}

## A2 — machine-readability of raw HTML (n=${reach.length})

| | Share |
|---|---|
${row('No phone number anywhere in HTML and no `tel:` link', noPhoneAnywhere, reach.length)}
${row('No phone number in visible text', noPhoneVisible, reach.length)}
${row('No `tel:` link', noTel, reach.length)}
${row('No street address or "ST 12345" in visible text', noAddr, reach.length)}
${row('No day-name + time pattern in visible text (hours, heuristic)', noHours, reach.length)}
${row('noindex', noindex, reach.length)}
${row('Final URL not HTTPS', notHttps, reach.length)}

## A3 — LocalBusiness structured data (n=${reach.length})

| | Share |
|---|---|
${row('≥1 LocalBusiness(-subtype) entity', lb1, reach.length)}
${row('≥2 LocalBusiness entities', lb2, reach.length)}
${row('≥2 with conflicting phone or address', conflict, reach.length)}
${row('JSON-LD present but unparseable (≥1 block)', ldErr, reach.length)}

Of sites with an entity (n=${lb1.length}): telephone ${pct(lbf('telephone').length, lb1.length)}; address as object ${pct(lbf('addressIsObject').length, lb1.length)}; address as string ${pct(lbf('addressIsString').length, lb1.length)}; geo ${pct(lbf('geo').length, lb1.length)}; hours ${pct(lbf('hours').length, lb1.length)}; image ${pct(lbf('image').length, lb1.length)}; sameAs ${pct(lbf('sameAs').length, lb1.length)}.

## By builder (reachable)

| Builder | n | Cloudflare | Citation block | Phone absent | Conflicting schema | No schema | Any strict defect |
|---|---|---|---|---|---|---|---|
${Object.entries(byBuilder).sort((a, b) => b[1].n - a[1].n).map(([k, c]) => `| ${k} | ${c.n} | ${c.cf} | ${c.cit} | ${c.phone} | ${c.conf} | ${c.noLb} | ${pct(c.any, c.n)} |`).join('\n')}

## By category (reachable)

| Category | n | Citation block | Phone absent | Conflicting schema | No schema | Any strict defect |
|---|---|---|---|---|---|---|
${Object.entries(byCat).sort((a, b) => b[1].n - a[1].n).map(([k, c]) => `| ${k} | ${c.n} | ${c.cit} | ${c.phone} | ${c.conf} | ${c.noLb} | ${pct(c.any, c.n)} |`).join('\n')}
`);
