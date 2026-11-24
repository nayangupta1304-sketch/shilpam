'use strict';

const FORMATS = {
  ig_4x5: {
    label: 'Instagram portrait feed post',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    generationWidth: 1024,
    generationHeight: 1280,
    textPlacement: 'bottom',
    composition: 'a vertical portrait image with one striking focal subject in the upper two-thirds and simple, low-detail forms near the bottom edge',
    platformGuidance: 'Use contemporary editorial art direction, bold color, tactile details, and a distinctive visual hook that remains clear at small size.'
  },
  ig_1x1: {
    label: 'Instagram square feed post',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    generationWidth: 1024,
    generationHeight: 1024,
    textPlacement: 'bottom',
    composition: 'a balanced square image with one strong focal subject above center and an uncluttered lower area',
    platformGuidance: 'Use contemporary editorial art direction, bold color, tactile details, and a strong, instantly recognizable focal image.'
  },
  yt_16x9: {
    label: 'YouTube thumbnail',
    width: 1920,
    height: 1080,
    ratio: '16:9',
    generationWidth: 2048,
    generationHeight: 1152,
    textPlacement: 'left',
    composition: 'a wide horizontal image with one instantly recognizable focal subject on the right and a quiet, darker area across the left half',
    platformGuidance: 'Use bold contrast and one striking visual idea with forms that remain recognizable when the image is small.'
  },
  li_191: {
    label: 'LinkedIn landscape feed post',
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    generationWidth: 2048,
    generationHeight: 1072,
    textPlacement: 'left',
    composition: 'a wide landscape image with a polished focal subject on the right and quiet negative space on the left',
    platformGuidance: 'Use a contemporary professional editorial style: credible, clean, and visually simple; avoid interface or profile-cover layouts.'
  }
};

module.exports = { FORMATS };
