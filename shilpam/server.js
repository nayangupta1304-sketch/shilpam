'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const app = express();
app.disable('x-powered-by');
const json = express.json({ limit: '8kb' });
const imageJson = express.json({ limit: '1mb' });
app.post('/api/ai', json, require('./api/ai'));
app.post('/api/improve', json, require('./api/improve'));
app.post('/api/image', imageJson, require('./api/image'));
app.get('/api/health', (req, res) => res.json({
  ok: true,
  text: !!process.env.GROQ_API_KEY,
  image: !!(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)
}));
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(
  `Shilpam running at http://localhost:${PORT}  (Groq text ${process.env.GROQ_API_KEY ? 'on' : 'off'}, Cloudflare images ${process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID ? 'on' : 'off'})`
));
