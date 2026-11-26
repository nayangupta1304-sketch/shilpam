'use strict'
// Single server-side endpoint. The browser never sees the API key, the model name or the prompts.
const { clean, parseJSON, limited, body: readBody } = require('../lib/util')
const { groqChat } = require('../lib/groq')
const SYS =
  'You write short poster copy. Reply with valid JSON only: no markdown, no commentary.'
const { TYPES, VOICE } = require('../lib/consts')
const { FORMATS } = require('../lib/platforms')
const PLATFORMS = Object.values(FORMATS).map((format) => format.label)
const shortCopy = (value, wordLimit, charLimit) =>
  clean(value, charLimit)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, wordLimit)
    .join(' ')

const hex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

const TASKS = {
  ideas: {
    max: 300,
    prompt: (b) =>
      `You are a poster copywriter. Post type: ${TYPES[b.type]}. The user's idea: "${clean(b.topic, 300)}". ${b.extra ? 'Details: ' + clean(b.extra, 200) + '.' : ''} Return ONLY a JSON array of 4 objects {"headline":"max 5 words","angle":"max 9 words describing the hook"}.`,
    check: (d) =>
      Array.isArray(d) ?
        d
          .filter(
            (x) =>
              x &&
              typeof x.headline === 'string' &&
              x.headline.length &&
              x.headline.length < 46,
          )
          .slice(0, 4)
          .map((x) => ({
            headline: clean(x.headline, 45),
            angle: clean(x.angle, 70),
          }))
      : [],
    ok: (d) => d.length > 0,
  },
  copy: {
    max: 300,
    prompt: (b) => {
      const p =
        b.pick && b.pick.headline ?
          `Preferred headline angle: "${clean(b.pick.headline, 45)}" (${clean(b.pick.angle, 70)}).`
        : ''
      const pf =
        (Array.isArray(b.platforms) ? b.platforms : [])
          .filter((x) => PLATFORMS.includes(x))
          .join(', ') || 'social media'
      return `Write minimal, correctly spelled poster copy. Proofread every word; preserve names, dates, and places exactly; invent no facts. Let the artwork carry the idea, not extra text. Post type: ${TYPES[b.type]}. Idea: "${clean(b.topic, 300)}". ${b.extra ? 'Select only the single most important short detail: ' + clean(b.extra, 200) + '.' : ''} ${p} Voice: ${VOICE[b.style] || VOICE.nature}. Platforms: ${pf}. Return ONLY JSON {"headline":"2-4 words","kicker":"1-2 words","sub":"up to 5 words, one key detail only","cta":"1-2 words"}.`
    },
    check: (d) =>
      d && typeof d === 'object' ?
        {
          headline: shortCopy(d.headline, 4, 40),
          kicker: shortCopy(d.kicker, 2, 24),
          sub: shortCopy(d.sub, 5, 90),
          cta: shortCopy(d.cta, 2, 18),
        }
      : null,
    ok: (d) => d && d.headline && d.kicker && d.sub && d.cta,
  },
  palette: {
    max: 120,
    prompt: (b) =>
      `Choose a 4-colour poster palette for: "${clean(b.topic, 300)}" (${TYPES[b.type]}). Calm, nature-inspired, and include a small touch of light red/coral as accent unless the topic clearly needs otherwise. Return ONLY JSON {"bg":"#rrggbb","fg":"#rrggbb","a":"#rrggbb","b":"#rrggbb"} where fg has strong contrast on bg, a is an accent, b is a soft secondary.`,
    check: (d) => d || null,
    ok: (d) => d && hex(d.bg) && hex(d.fg) && hex(d.a) && hex(d.b),
  },
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const send = (code, obj) => res.status(code).json(obj)
  if (req.method !== 'POST') return send(405, { ok: false, code: 'method' })
  if (!process.env.GROQ_API_KEY) return send(503, { ok: false, code: 'no_key' })
  if (limited(req, 'ai', 30))
    return send(429, { ok: false, code: 'rate_limited' })
  const b = readBody(req)
  const task = b && TASKS[b.task]
  if (!task || !TYPES[b.type] || clean(b.topic, 300).length < 3)
    return send(400, { ok: false, code: 'bad_request' })

  try {
    const text = await groqChat(SYS, task.prompt(b), task.max)
    const data = task.check(parseJSON(text))
    if (!task.ok(data)) return send(502, { ok: false, code: 'bad_output' })
    return send(200, { ok: true, data })
  } catch (e) {
    return send(502, { ok: false, code: e.code || 'failed', detail: e.detail })
  }
}
