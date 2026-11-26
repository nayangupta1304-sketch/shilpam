# Shilpam (शिल्पम्) — AI poster studio

Pick a post type, describe the idea (optionally let AI sharpen it), choose a design and platforms, and get fresh Cloudflare artwork with the exact poster copy layered on top for each selected platform. Click any poster to open a full-size preview with zoom controls; PNG export remains a separate action. The app's default poster layout is used if Cloudflare image generation fails.



##  If something fails midway

| Failure | What happens |
|---|---|
| No Groq key, quota used up, timeout, 429/5xx on text | built-in wording, palette, and artwork are used, with a small notice |
| Groq fails on "Improve my idea" | your idea stays unchanged; the picture then uses a plain template prompt |
| Cloudflare credentials are missing or any selected platform image fails | the generated-image set is discarded; Shilpam uses the uploaded photo with exact copy when available, otherwise the default layout |
| OCR detects lettering in a generated image, or cannot verify it | unsafe generated artwork is discarded; Shilpam uses the uploaded photo with exact copy when available, otherwise the default layout |
| Cloudflare returns 403 | confirm the token is active, has Workers AI Read and Edit permissions, and belongs to the configured Account ID |
| Refresh mid-way | progress is restored in the same tab (generated Cloudflare artwork is not stored; generate the poster set again). A new tab starts a fresh session. |
| Font embedding fails during export | export retries without embedded fonts |
| Export library blocked / offline | notice asks for a screenshot |
| Someone spams the endpoints | rate limits (30/min copy, 20/min improve, 6/min pictures per IP) and fixed fields mean your keys cannot be used as a free chatbot |


