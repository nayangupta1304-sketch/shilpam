'use strict';
const TYPES = { event: 'Event invite', launch: 'Product launch', festival: 'Festival greeting', offer: 'Sale or offer', news: 'Announcement', quote: 'Quote or thought' };
const VOICE = { nature: 'warm, thoughtful, human', street: 'loud, short, streetwear flyer', swiss: 'calm, precise, understated', pop: 'joyful, playful', ai: 'confident and fitting the topic' };
const LOOK = {
  nature: 'calm cream, sage green and a blush of coral, hand-painted Indian folk-art feel (Madhubani and dot-mandala inspired)',
  street: 'bold urban illustration, high contrast, halftone texture',
  swiss: 'minimal flat shapes, lots of whitespace, one soft coral accent',
  pop: 'joyful festive pop colours, playful shapes, warm gradient',
  ai: 'harmonious calm nature-inspired palette'
};
module.exports = { TYPES, VOICE, LOOK };
