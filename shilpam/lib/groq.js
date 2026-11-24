'use strict';
// All text AI in Shilpam uses Groq: poster copy, palette, and the structured image brief.
const { timedFetch, responseErrorDetail, wait, RETRY } = require('./util');
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// The system prompt is the "well structured prompt": role, hard rules, output schema.
const SYSTEM = [
  'You create concise briefs for text-free image backgrounds.',
  'Turn the user\'s rough idea into one structured visual scene for an illustrator.',
  'RULES:',
  '1. Keep every fact the user gave (names, dates, places, prices). Never invent new ones.',
  '2. The image must contain NO text, lettering, numbers, symbols, logos, or watermarks.',
  '3. Describe only visible subjects, framing, art style, palette, and mood. Never suggest words or lettering to show.',
  '4. Describe one clear illustration, not a designed graphic, page, sign, or collage.',
  '5. Reply with valid JSON only: no markdown, no commentary.'
].join('\n');

function userPrompt({ typeLabel, look, topic, extra }) {
  return `SCENE CATEGORY: ${typeLabel}
ART STYLE: ${look}
SCENE IDEA (meaning only; do not repeat it as visible writing): "${topic}"
${extra ? `VISUAL DETAILS (depict only as objects or scenery; do not write them): "${extra}"\n` : ''}
Return ONLY this JSON:
{
  "idea": "the same idea rewritten clearer and more vivid, max 35 words, no new facts",
  "art": {
    "subject": "the one main thing shown, max 20 words",
    "composition": "camera framing and arrangement of visible subjects, max 20 words",
    "style": "art style and technique, max 15 words",
    "palette": "3 to 5 colours, max 15 words",
    "mood": "feeling of the picture, max 8 words"
  }
}`;
}

// Generic Groq chat call (JSON text back). Retries once when the service is busy.
async function groqChat(system, user, maxTokens) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await timedFetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.6,
          max_completion_tokens: maxTokens,
          reasoning_effort: 'low',
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
        })
      }, 9000);
      if (r.ok) { const j = await r.json(); return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''; }
      if (!RETRY.includes(r.status)) {
        const e = new Error('upstream');
        e.code = 'upstream_' + r.status;
        e.detail = await responseErrorDetail(r);
        throw e;
      }
    } catch (e) { if (e.code && e.code !== 'timeout') throw e; }
    await wait(600);
  }
  const e = new Error('busy'); e.code = 'busy'; throw e;
}
module.exports = { groqChat, SYSTEM, userPrompt };
