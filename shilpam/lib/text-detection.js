'use strict'

const { createWorker } = require('tesseract.js')

let workerPromise
let recognitionQueue = Promise.resolve()

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng').catch((error) => {
      workerPromise = null
      throw error
    })
  }
  return workerPromise
}

function containsText(image) {
  const job = recognitionQueue.then(async () => {
    const worker = await getWorker()
    const { data } = await worker.recognize(image, {}, { text: true, blocks: true })
    const words = []
    for (const block of data.blocks || [])
      for (const paragraph of block.paragraphs || [])
        for (const line of paragraph.lines || [])
          words.push(...(line.words || []))

    const recognized = words.filter((word) => {
      const letters = word.text.replace(/[^A-Za-z0-9]/g, '')
      return letters.length >= 2 && word.confidence >= 30
    })
    return recognized.length >= 2 || recognized.some((word) => {
      const letters = word.text.replace(/[^A-Za-z0-9]/g, '')
      return letters.length >= 3 && word.confidence >= 70
    })
  })
  recognitionQueue = job.then(() => undefined, () => undefined)
  return job
}

module.exports = { containsText }
