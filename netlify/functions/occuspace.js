const OCCUSPACE_BASE = 'https://api.occuspace.io/v1';

export default async function handler(req) {
  const token = process.env.OCCUSPACE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'OCCUSPACE_API_TOKEN is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // The frontend sends: /.netlify/functions/occuspace?path=/locations/4145/now&start=...
  const reqUrl = new URL(req.url);
  const apiPath = reqUrl.searchParams.get('path') || '';
  reqUrl.searchParams.delete('path');

  const upstreamUrl = new URL(`${OCCUSPACE_BASE}${apiPath}`);
  reqUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: `Upstream error: ${err.message}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
