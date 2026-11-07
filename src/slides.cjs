const PptxGenJS = require('pptxgenjs');

const colors = { maroon: '772432', blue: '004165', gray: 'A9B2B1', yellow: 'F2DF74', white: 'FFFFFF' };

async function writeDeck(deck, filename) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Dongtan Toastmasters';
  pptx.title = `Dongtan Toastmasters · Meeting #${deck.number}`;
  pptx.theme = { headFontFace: 'Montserrat', bodyFontFace: 'Source Sans 3', lang: 'en-US' };
  deck.slides.forEach((source, index) => {
    const slide = pptx.addSlide();
    const background = ['Welcome', 'Debate', 'Closing'].includes(source.name) ? colors.maroon : colors.blue;
    slide.background = { color: background };
    slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 0.95, w: 0.7, h: 0.07, line: { transparency: 100 }, fill: { color: colors.yellow } });
    slide.addText('DONGTAN TOASTMASTERS', { x: 0.8, y: 0.42, w: 10, h: 0.34, color: colors.white, fontSize: 15, charSpacing: 1.5, margin: 0 });
    const textWidth = source.media ? 6.2 : 11.6;
    slide.addText(source.name.toUpperCase(), { x: 0.8, y: 1.55, w: textWidth, h: 0.4, color: colors.yellow, fontSize: 16, margin: 0 });
    slide.addText(source.title, { x: 0.8, y: 2.05, w: textWidth, h: 1.45, color: colors.white, fontFace: 'Montserrat', bold: true, fontSize: source.title.length > 50 ? 32 : 44, margin: 0, valign: 'mid', fit: 'shrink' });
    slide.addText(source.lines.join('\n'), { x: 0.8, y: 3.75, w: textWidth, h: 2.75, color: colors.white, fontSize: 22, margin: 0, valign: 'top', fit: 'shrink' });
    if (source.media) {
      slide.addImage({ data: source.media, x: 7.35, y: 1.4, w: 5.15, h: 4.9, sizing: { type: source.image?.fit === 'contain' ? 'contain' : 'cover', w: 5.15, h: 4.9 }, altText: source.image?.alt || source.name });
    }
    slide.addText(`MEETING #${deck.number}  /  ${String(index + 1).padStart(2, '0')}`, { x: 0.8, y: 6.89, w: 11.7, h: 0.25, color: colors.gray, fontSize: 12, margin: 0 });
    slide.addNotes(source.cue);
  });
  await pptx.writeFile({ fileName: filename });
}

module.exports = { writeDeck };
