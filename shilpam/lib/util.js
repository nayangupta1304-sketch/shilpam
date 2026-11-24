'use strict';
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
const parseJSON = t => JSON.parse(String(t).replace(/```json|```/g, '').trim());
const hits = new Map();
// tiny per-IP limiter (best effort on serverless)
function limited(req, bucket, max) {
  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();
  const k = bucket + ':' + ip, now = Date.now(), arr = (hits.get(k) || []).filter(t => now - t < 60000);
  arr.push(now); hits.set(k, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}
function body(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  return b && typeof b === 'object' ? b : null;
}
// fetch with timeout; throws {code:'timeout'} on abort
async function timedFetch(url, opts, ms) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal }); }
  catch (e) { const x = new Error('timeout'); x.code = 'timeout'; throw x; }
  finally { clearTimeout(t); }
}
async function responseErrorDetail(response) {
  const raw = await response.text();
  let body;
  try { body = JSON.parse(raw); } catch { body = null; }
  const error = body && body.error;
  const errors = body && Array.isArray(body.errors)
    ? body.errors.map(item => item && typeof item.message === 'string' ? item.message : '').filter(Boolean)
    : [];
  const detail = [
    error && typeof error.message === 'string' && error.message,
    body && typeof body.message === 'string' && body.message,
    body && typeof body.detail === 'string' && body.detail,
    typeof error === 'string' && error,
    errors[0],
    raw.trim() && JSON.stringify(body || raw)
  ].find(value => typeof value === 'string' && value.trim()) ||
    `Provider returned HTTP ${response.status} with an empty error response.`;
  return clean(detail, 500)
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(?:gsk_|AIza|sk_|pk_|cfut_)[A-Za-z0-9_-]+/gi, '[redacted]')
    .slice(0, 240);
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const RETRY = [429, 500, 502, 503, 529];
module.exports = { clean, parseJSON, limited, body, timedFetch, responseErrorDetail, wait, RETRY };
