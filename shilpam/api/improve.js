'use strict'
// POST /api/improve  { type, topic, extra?, style? }  ->  { ok, data: { idea, visual } }
// idea   = the user's idea, rewritten clearer (Groq)
// visual = the art prompt that /api/image sends to Cloudflare Workers AI
const { clean, limited, body: readBody } = require('../lib/util')
const { TYPES } = require('../lib/consts')
const { makeBrief } = require('../lib/brief')

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const send = (c, o) => res.status(c).json(o)
  if (req.method !== 'POST') return send(405, { ok: false, code: 'method' })
  if (!process.env.GROQ_API_KEY) return send(503, { ok: false, code: 'no_key' })
  if (limited(req, 'improve', 20))
    return send(429, { ok: false, code: 'rate_limited' })
  const b = readBody(req)
  if (!b || !TYPES[b.type] || clean(b.topic, 300).length < 3)
    return send(400, { ok: false, code: 'bad_request' })
  try {
    const r = await makeBrief(b)
    return send(200, { ok: true, data: { idea: r.idea, visual: r.prompt } })
  } catch (e) {
    return send(502, { ok: false, code: e.code || 'failed', detail: e.detail })
  }
}
