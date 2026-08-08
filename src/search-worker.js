const OFFICIAL_SOURCES = Object.freeze([
  { host: 'ratchakitcha.soc.go.th', name: 'ราชกิจจานุเบกษา', priority: 100 },
  { host: 'krisdika.go.th', name: 'สำนักงานคณะกรรมการกฤษฎีกา', priority: 98 },
  { host: 'cgd.go.th', name: 'กรมบัญชีกลาง', priority: 96 },
  { host: 'moi.go.th', name: 'กระทรวงมหาดไทย', priority: 94 },
  { host: 'dla.go.th', name: 'กรมส่งเสริมการปกครองท้องถิ่น', priority: 93 },
  { host: 'admincourt.go.th', name: 'ศาลปกครอง', priority: 92 },
  { host: 'coj.go.th', name: 'สำนักงานศาลยุติธรรม', priority: 91 },
  { host: 'bb.go.th', name: 'สำนักงบประมาณ', priority: 90 },
  { host: 'nacc.go.th', name: 'สำนักงาน ป.ป.ช.', priority: 90 },
  { host: 'pacc.go.th', name: 'สำนักงาน ป.ป.ท.', priority: 89 },
  { host: 'audit.go.th', name: 'สำนักงานการตรวจเงินแผ่นดิน', priority: 89 },
  { host: 'supremecourt.or.th', name: 'ศาลฎีกา', priority: 88 }
]);

const OFFICIAL_HOSTS = new Set(OFFICIAL_SOURCES.map(source => source.host));
const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': FRONTEND_ORIGIN,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'Origin'
});

const TOPIC_PLANS = Object.freeze([
  { id: 'travel-finance', match: /(เดินทาง|ไปราชการ|ค่าเบี้ยเลี้ยง|ค่าที่พัก|ค่าพาหนะ|แท็กซี่|เบิกจ่าย)/, phrases: ['ค่าใช้จ่ายในการเดินทางไปราชการ', 'องค์กรปกครองส่วนท้องถิ่น'], preferredHosts: ['dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th', 'cgd.go.th'] },
  { id: 'procurement', match: /(พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|e-bidding|เฉพาะเจาะจง|คัดเลือก|ผู้รับจ้าง)/i, phrases: ['การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ', 'องค์กรปกครองส่วนท้องถิ่น'], preferredHosts: ['cgd.go.th', 'dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th', 'audit.go.th'] },
  { id: 'personnel', match: /(บุคคล|ข้าราชการ|พนักงานส่วนท้องถิ่น|เลื่อนเงินเดือน|สอบแข่งขัน|บรรจุ|แต่งตั้ง|โอน|ย้าย|วินัย)/, phrases: ['การบริหารงานบุคคลส่วนท้องถิ่น', 'มาตรฐานทั่วไป'], preferredHosts: ['dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th', 'admincourt.go.th'] },
  { id: 'council', match: /(สภาท้องถิ่น|สภา อบจ|สภาเทศบาล|สภา อบต|ข้อบัญญัติ|ญัตติ|สมัยประชุม|ประชุมสภา)/, phrases: ['สภาท้องถิ่น', 'องค์กรปกครองส่วนท้องถิ่น'], preferredHosts: ['dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th'] },
  { id: 'public-health', match: /(รพ\.สต|สาธารณสุข|เงินบำรุง|สถานีอนามัย|โรงพยาบาลส่งเสริมสุขภาพตำบล)/i, phrases: ['องค์กรปกครองส่วนท้องถิ่น', 'สาธารณสุข'], preferredHosts: ['dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th'] },
  { id: 'budget', match: /(งบประมาณ|ข้อบัญญัติงบประมาณ|โอนงบ|เปลี่ยนแปลงคำชี้แจง|เงินสะสม|กันเงิน)/, phrases: ['งบประมาณองค์กรปกครองส่วนท้องถิ่น'], preferredHosts: ['dla.go.th', 'moi.go.th', 'bb.go.th', 'audit.go.th', 'ratchakitcha.soc.go.th'] },
  { id: 'law', match: /(พระราชบัญญัติ|พ\.ร\.บ|กฎกระทรวง|ระเบียบ|ประกาศ|มาตรา|คำพิพากษา|อำนาจหน้าที่)/i, phrases: ['กฎหมายท้องถิ่น'], preferredHosts: ['ratchakitcha.soc.go.th', 'krisdika.go.th', 'dla.go.th', 'moi.go.th', 'admincourt.go.th', 'supremecourt.or.th'] }
]);

function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS }); }
function normalizeHost(value) { return String(value || '').trim().toLowerCase().replace(/^www\./, ''); }
function sourceForHost(host) { const normalized = normalizeHost(host); return OFFICIAL_SOURCES.find(source => normalized === source.host || normalized.endsWith(`.${source.host}`)) || null; }
function isOfficialHost(host) { return Boolean(sourceForHost(host)); }
function cleanText(value, max = 500) { return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
function normalizeDate(value) { const raw = cleanText(value, 100); if (!raw) return ''; const iso = /(20\d{2}|19\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(raw); if (iso) { const [, y, m, d] = iso; return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; } const parsed = Date.parse(raw); return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : ''; }
function parseRequestBody(body) { const query = cleanText(body?.query, 400); const sites = Array.isArray(body?.sites) ? body.sites.map(normalizeHost).filter(isOfficialHost).slice(0, 12) : []; const count = Math.min(Math.max(Number(body?.count) || 10, 1), 20); return { query, sites, count }; }
function normalizeForMatch(value) { return cleanText(value, 2000).normalize('NFKC').toLowerCase(); }
function queryTerms(query) { return normalizeForMatch(query).split(/[\s,.;:()\[\]{}"'\/\\|+-]+/).map(term => term.trim()).filter(term => term.length >= 2 && !['ล่าสุด', 'ปัจจุบัน', 'เรื่อง', 'และ', 'หรือ', 'ของ', 'ให้', 'กับ', 'ช่วย', 'หา', 'ค้น'].includes(term)); }
function classifyTopic(query) { const normalized = normalizeForMatch(query); return TOPIC_PLANS.find(plan => plan.match.test(normalized)) || { id: 'general-local-government', phrases: ['องค์กรปกครองส่วนท้องถิ่น'], preferredHosts: ['dla.go.th', 'moi.go.th', 'ratchakitcha.soc.go.th', 'krisdika.go.th', 'cgd.go.th'] }; }

function buildSearchPlan(query, requestedSites) {
  const topic = classifyTopic(query);
  const wantsLatest = /(ล่าสุด|ปัจจุบัน|แก้ไขล่าสุด|ฉบับปัจจุบัน|ยังใช้บังคับ)/.test(normalizeForMatch(query));
  const sites = requestedSites.length ? requestedSites : topic.preferredHosts.filter(isOfficialHost);
  const core = cleanText(query.replace(/ล่าสุด|ปัจจุบัน/g, ' '), 300);
  const context = topic.phrases.join(' ');
  const primary = `${core} ${context}`.trim();
  const verification = wantsLatest ? `${core} ${context} ฉบับปัจจุบัน แก้ไขเพิ่มเติม หนังสือสั่งการ` : `${core} ${context} ระเบียบ ประกาศ หนังสือสั่งการ`;
  return { topicId: topic.id, wantsLatest, sites, variants: primary === verification ? [primary] : [primary, verification], preferredHosts: topic.preferredHosts };
}

function freshnessScore(date, wantsLatest) { if (!date) return wantsLatest ? -12 : -2; const ageDays = Math.max(0, (Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86400000); if (ageDays <= 30) return 24; if (ageDays <= 180) return 18; if (ageDays <= 365) return 12; if (ageDays <= 1095) return 4; return wantsLatest ? -8 : 0; }
function normalizeResult(item) { const url = cleanText(item?.url, 1200); let host = ''; try { host = new URL(url).hostname; } catch {} const source = sourceForHost(host); if (!url || !source) return null; return { title: cleanText(item?.title, 300), url, snippet: cleanText(item?.content ?? item?.description ?? item?.snippet, 700), host: normalizeHost(host), sourceName: source.name, sourceTier: 'primary', sourcePriority: source.priority, documentDate: normalizeDate(item?.published_date ?? item?.page_age), effectiveDate: '', status: 'unknown', lastVerifiedAt: '' }; }
function topicHostBoost(host, plan) { const index = plan.preferredHosts.indexOf(host); if (index < 0) return 0; return Math.max(4, 24 - index * 4); }
function documentTypeBoost(result, query) { const haystack = normalizeForMatch(`${result.title} ${result.snippet} ${result.url}`); let score = 0; if (/\.pdf(?:$|[?#])/.test(result.url.toLowerCase())) score += 5; if (/(ระเบียบ|ประกาศ|หนังสือ|กฎกระทรวง|พระราชบัญญัติ|พ\.ร\.บ|ข้อหารือ|คำวินิจฉัย)/i.test(haystack)) score += 7; if (/(ข่าว|กิจกรรม|ประชาสัมพันธ์|facebook|youtube)/i.test(haystack)) score -= 10; if (/(ระเบียบ|กฎกระทรวง|พระราชบัญญัติ|หนังสือสั่งการ)/i.test(query) && !/(ระเบียบ|กฎกระทรวง|พระราชบัญญัติ|พ\.ร\.บ|หนังสือ|ประกาศ)/i.test(haystack)) score -= 8; return score; }
function rankResults(results, query, count, plan) { const terms = queryTerms(query); const seen = new Set(); return results.filter(result => { const key = result.url.replace(/[?#].*$/, '').replace(/\/$/, ''); if (seen.has(key)) return false; seen.add(key); return true; }).map(result => { const title = normalizeForMatch(result.title); const snippet = normalizeForMatch(result.snippet); const matchedTerms = terms.reduce((sum, term) => sum + (title.includes(term) ? 10 : 0) + (snippet.includes(term) ? 3 : 0), 0); const score = result.sourcePriority + matchedTerms + freshnessScore(result.documentDate, plan.wantsLatest) + topicHostBoost(result.host, plan) + documentTypeBoost(result, query); return { ...result, relevanceScore: score }; }).sort((a, b) => b.relevanceScore - a.relevanceScore || (b.documentDate || '').localeCompare(a.documentDate || '') || b.sourcePriority - a.sourcePriority).slice(0, count); }

async function tavilyRequest(env, query, sites, maxResults) {
  const response = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { accept: 'application/json', authorization: `Bearer ${env.TAVILY_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ query, search_depth: 'advanced', max_results: maxResults, include_answer: false, include_raw_content: false, include_domains: sites }) });
  if (!response.ok) return { ok: false, status: response.status, results: [] };
  const data = await response.json();
  return { ok: true, status: response.status, results: Array.isArray(data?.results) ? data.results : [] };
}

async function searchTavily(env, payload) {
  if (!env.TAVILY_API_KEY) return { ok: false, status: 503, error: 'SEARCH_PROVIDER_NOT_CONFIGURED' };
  const plan = buildSearchPlan(payload.query, payload.sites);
  const candidateLimit = Math.min(Math.max(payload.count, 8), 12);
  const collected = [];
  for (let i = 0; i < plan.variants.length; i += 1) {
    const response = await tavilyRequest(env, plan.variants[i], plan.sites, candidateLimit);
    if (!response.ok) { if (!collected.length) return { ok: false, status: 502, error: 'SEARCH_PROVIDER_ERROR', providerStatus: response.status }; break; }
    collected.push(...response.results);
    if (!plan.wantsLatest && collected.length >= payload.count) break;
    if (collected.length >= payload.count * 2) break;
  }
  const normalized = collected.map(normalizeResult).filter(Boolean);
  return { ok: true, results: rankResults(normalized, payload.query, payload.count, plan), provider: 'tavily', plan: { strategy: 'government-search-planner-v1', topicId: plan.topicId, wantsLatest: plan.wantsLatest, variants: plan.variants, sites: plan.sites } };
}

async function fetchAsset(request, env, url) { if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') return new Response('Not Found', { status: 404 }); if (url.pathname === '/') { const indexUrl = new URL(request.url); indexUrl.pathname = '/index.html'; return env.ASSETS.fetch(new Request(indexUrl, request)); } return env.ASSETS.fetch(request); }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/official-search') return fetchAsset(request, env, url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
    if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
    const payload = parseRequestBody(body);
    if (!payload.query) return json({ ok: false, error: 'QUERY_REQUIRED' }, 400);
    const search = await searchTavily(env, payload);
    if (!search.ok) return json({ ok: false, error: search.error, providerStatus: search.providerStatus ?? null }, search.status);
    return json({ ok: true, query: payload.query, sites: search.plan?.sites ?? payload.sites, provider: search.provider, searchedAt: new Date().toISOString(), searchPlan: search.plan, results: search.results });
  }
};
