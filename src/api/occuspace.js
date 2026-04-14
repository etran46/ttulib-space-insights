const BASE_URL = 'https://api.occuspace.io/v1';

function getToken() {
  return import.meta.env.VITE_OCCUSPACE_API_TOKEN || '';
}

async function apiFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Occuspace API ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.data;
}

// Ensures the result is always an array — the API wraps arrays in named keys
// e.g. { dailyOccupancy: [...] } or { hourlyOccupancy: [...] }
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const values = Object.values(data);
    const arr = values.find(v => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
}

// GET /locations — list all locations
export async function fetchLocations() {
  const data = await apiFetch('/locations');
  return ensureArray(data);
}

// GET /locations/:id/now — real-time occupancy (returns object, not array)
export async function fetchLocationNow(id) {
  return apiFetch(`/locations/${id}/now`);
}

// GET /locations/:id/hourly_occupancy?start=&end=
export async function fetchHourlyOccupancy(id, start, end) {
  const data = await apiFetch(`/locations/${id}/hourly_occupancy`, { start, end });
  return ensureArray(data);
}

// GET /locations/:id/daily_occupancy?start=&end=
export async function fetchDailyOccupancy(id, start, end) {
  const data = await apiFetch(`/locations/${id}/daily_occupancy`, { start, end });
  return ensureArray(data);
}

// GET /locations/:id/daily_visitors?start=&end=
export async function fetchDailyVisitors(id, start, end) {
  const data = await apiFetch(`/locations/${id}/daily_visitors`, { start, end });
  return ensureArray(data);
}

// GET /locations/:id/hourly_visitors?start=&end=
export async function fetchHourlyVisitors(id, start, end) {
  const data = await apiFetch(`/locations/${id}/hourly_visitors`, { start, end });
  return ensureArray(data);
}

// GET /locations/:id/daily_dwell_time?start=&end=
export async function fetchDailyDwellTime(id, start, end) {
  const data = await apiFetch(`/locations/${id}/daily_dwell_time`, { start, end });
  return ensureArray(data);
}

// Helper: format Date to YYYY-MM-DD
export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

// Helper: get today's date string
export function today() {
  return fmtDate(new Date());
}

// Helper: get a date N days ago
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDate(d);
}

// Helper: strip numeric prefixes from location names (e.g. "01_Main Floor" → "Main Floor")
export function cleanName(name) {
  return (name || '').replace(/^\d+[_\-]\s*/, '');
}
