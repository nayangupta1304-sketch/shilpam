'use strict';
const { timedFetch, responseErrorDetail } = require('./util');
const { LOOK } = require('./consts');

const MODEL = '@cf/black-forest-labs/flux-2-klein-4b';

function buildPosterPrompt({ format, topic, extra, style, visual }) {
  return [
    `Generate one full-bleed image for a ${format.ratio} canvas at ${format.generationWidth}x${format.generationHeight}px; the final canvas is ${format.width}x${format.height}px.`,
    'Return only a cohesive photograph or illustration, not a designed graphic, advertisement, cover, page, collage, mockup, or user interface.',
    `Scene to depict (meaning only; never reproduce these words visibly): ${JSON.stringify(topic)}.`,
    extra && `Additional visual details only; never spell or display these terms: ${JSON.stringify(extra)}.`,
    `Framing: ${format.composition}. ${format.platformGuidance} Keep the ${format.textPlacement} area visually calm and low-detail.`,
    `Art direction: ${LOOK[style] || LOOK.nature}.`,
    visual && `Optional visual guidance for subject, framing, style, and palette only: ${JSON.stringify(visual)}.`,
    'Absolute exclusions: no text, letters, numbers, punctuation, typography, symbols, logos, watermarks, signatures, labels, pseudo-writing, or glyph-like marks. No signs, packaging, UI, interface chrome, hearts, usernames, handles, buttons, badges, screens, or device frames.',
    'Do not render any words from the scene description. Fill every edge with natural image content; no borders or frames.'
  ].filter(Boolean).join('\n');
}

async function generateCloudflareImage(prompt, format) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token) {
    const error = new Error('no_key');
    error.code = 'no_key';
    throw error;
  }
  if (!accountId) {
    const error = new Error('no_account_id');
    error.code = 'no_account_id';
    throw error;
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`;
  const body = new FormData();
  body.set('prompt', prompt);
  body.set('width', String(format.generationWidth));
  body.set('height', String(format.generationHeight));
  const response = await timedFetch(url, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + token,
      accept: 'application/json'
    },
    body
  }, 55000);

  if (!response.ok) {
    const error = new Error('upstream');
    error.code = 'upstream_' + response.status;
    const detail = await responseErrorDetail(response);
    error.detail = response.status === 403
      ? `${detail} Verify the token has Workers AI Read and Edit permissions and that the Account ID matches.`
      : detail;
    throw error;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    const error = new Error('invalid_response');
    error.code = 'invalid_response';
    error.detail = 'Cloudflare returned an invalid image response.';
    throw error;
  }

  const image = payload && payload.result && payload.result.image;
  if (typeof image !== 'string' || !image) {
    const error = new Error('invalid_response');
    error.code = 'invalid_response';
    error.detail = 'Cloudflare did not return a generated image.';
    throw error;
  }

  const bytes = Buffer.from(image, 'base64');
  if (!bytes.length) {
    const error = new Error('invalid_image');
    error.code = 'invalid_image';
    throw error;
  }
  return { mime: 'image/jpeg', b64: bytes.toString('base64') };
}

module.exports = { generateCloudflareImage, buildPosterPrompt };
