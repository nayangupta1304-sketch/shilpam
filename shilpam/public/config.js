// Shilpam artwork settings.
// mandala: circle cut from the dot-painted mandala (dot of the "i" + four corners).
// border: not set, so the original lotus-and-diamond border is used.
// To use the Madhubani border instead, add this line after `mandala` and set --bw to 64px in index.html:
//   border: { src: 'assets/border-madhubani.png', crop: { x: 0, y: 0, w: 1, h: 1 } }
window.SHILPAM = {
  mandala: { src: 'assets/mandala.png', circle: true, crop: { x: 0, y: 0, w: 1, h: 1 } }
};
