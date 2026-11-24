'use strict';

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, code: 'method' });
  return res.status(200).json({
    ok: true,
    text: !!process.env.GROQ_API_KEY,
    image: !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)
  });
};
