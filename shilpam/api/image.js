'use strict';
// POST /api/image { type, topic, style, platform, visual?, referenceImage? } -> { ok, data: { mime, b64 } }
const { clean, limited, body: readBody } = require('../lib/util');
const { TYPES, LOOK } = require('../lib/consts');
const { FORMATS } = require('../lib/platforms');
const { generateCloudflareImage, buildPosterPrompt } = require('../lib/cloudflare');
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const MAX_REFERENCE_BYTES = 512 * 1024;

function readReferenceImage(value) {
  if (value == null) return null;
  if (!value || value.mime !== 'image/jpeg' || typeof value.b64 !== 'string' ||
      value.b64.length > Math.ceil(MAX_REFERENCE_BYTES / 3) * 4) {
    return false;
  }
  const bytes = Buffer.from(value.b64, 'base64');
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg || bytes.length > MAX_REFERENCE_BYTES || bytes.toString('base64') !== value.b64) {
    return false;
  }
  return { mime: value.mime, bytes };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (c, o) => res.status(c).json(o);
  if (req.method !== 'POST') return send(405, { ok: false, code: 'method' });
  if (!process.env.CLOUDFLARE_API_TOKEN) return send(503, { ok: false, code: 'no_key' });
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) return send(503, { ok: false, code: 'no_account_id' });
  if (limited(req, 'image', 6)) return send(429, { ok: false, code: 'rate_limited' });
  const b = readBody(req);
  const format = b && typeof b.platform === 'string' && owns(FORMATS, b.platform)
    ? FORMATS[b.platform]
    : null;
  const topic = clean(b && b.topic, 300);
  const style = b && b.style;
  const referenceImage = readReferenceImage(b && b.referenceImage);
  if (!b || typeof b.type !== 'string' || !owns(TYPES, b.type) || topic.length < 3 ||
      !format || typeof style !== 'string' || !owns(LOOK, style) || referenceImage === false) {
    return send(400, { ok: false, code: 'bad_request' });
  }

  const prompt = buildPosterPrompt({
    format,
    type: b.type,
    topic,
    extra: clean(b.extra, 150),
    style,
    visual: clean(b.visual, 100),
    hasReferenceImage: !!referenceImage
  });
  try {
    const image = await generateCloudflareImage(prompt, format, referenceImage);
    return send(200, { ok: true, data: image });
  }
  catch (e) { return send(502, { ok: false, code: e.code || 'failed', detail: e.detail }); }
};
