'use strict'
// Builds the art brief with Groq and assembles the final prompt for image generation.
const { clean, parseJSON } = require('./util')
const { TYPES, LOOK } = require('./consts')
const { groqChat, SYSTEM, userPrompt } = require('./groq')

const f = (v, n) => clean(v, n)
function shape(d) {
  const a = d && d.art
  if (
    !d ||
    typeof d.idea !== 'string' ||
    !d.idea.trim() ||
    !a ||
    !a.subject ||
    !a.style
  )
    return null
  return {
    idea: f(d.idea, 260),
    art: {
      subject: f(a.subject, 160),
      composition: f(a.composition, 160),
      style: f(a.style, 120),
      palette: f(a.palette, 120),
      mood: f(a.mood, 70),
    },
  }
}

// STEP 2: turn the structured brief into ONE prompt string for the image model.
function assemblePrompt(art) {
  return [
    'Create a full-bleed, text-free image background.',
    `Subject: ${art.subject}.`,
    art.composition && `Framing: ${art.composition}.`,
    `Style: ${art.style}.`,
    art.palette && `Palette: ${art.palette}.`,
    art.mood && `Mood: ${art.mood}.`,
    'No words from the description may appear in the image. No text, letters, numbers, punctuation, signs, labels, logos, watermarks, or anything resembling writing. Fill the image edge to edge; no borders or frames.',
  ]
    .filter(Boolean)
    .join(' ')
}

// Fallback when no LLM is available: a plain template prompt from the user's own words.
function templatePrompt(b) {
  return `Create a full-bleed, text-free image background. Scene category: ${TYPES[b.type]}. Subject (meaning only; never reproduce these words visibly): ${f(b.topic, 300)}. Style: ${LOOK[b.style] || LOOK.nature}. No text, letters, numbers, signs, labels, logos, watermarks, or anything resembling writing. Fill the image edge to edge; no borders or frames.`
}

async function makeBrief(b) {
  const prompt = userPrompt({
    typeLabel: TYPES[b.type],
    look: LOOK[b.style] || LOOK.nature,
    topic: f(b.topic, 300),
    extra: f(b.extra, 200),
  })
  if (!process.env.GROQ_API_KEY) {
    const e = new Error('no_key')
    e.code = 'no_key'
    throw e
  }
  const d = shape(parseJSON(await groqChat(SYSTEM, prompt, 500)))
  if (!d) {
    const e = new Error('bad_output')
    e.code = 'bad_output'
    throw e
  }
  return { idea: d.idea, art: d.art, prompt: assemblePrompt(d.art) }
}
module.exports = { makeBrief, assemblePrompt, templatePrompt }
