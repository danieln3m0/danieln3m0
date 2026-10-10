---
name: Patrones de pliegue
description: GitHub profile README for danieln3m0 (branch origami), shipped as opaque two-sided kami SVG objects whose crease patterns are folded from live repo trees with the tree method.
colors:
  ai-indigo: "#1E3A5F"
  ai-deep: "#142A47"
  ai-tone: "#2B4A73"
  washi: "#F5F4EF"
  shu-vermilion: "#C8371F"
typography:
  display:
    fontFamily: "Zen Kaku Gothic New 900 (outlined)"
    fontSize: "44-46 full; 70-82 compact (SVG units)"
    fontWeight: 900
    lineHeight: 1.05
  label:
    fontFamily: "Zen Kaku Gothic New 900 (outlined)"
    fontSize: "14-22 full; 30-40 compact (SVG units)"
    fontWeight: 900
  body:
    fontFamily: "Zen Kaku Gothic New 500 (outlined)"
    fontSize: "13-17 full; 34-44 compact (SVG units)"
    fontWeight: 500
    lineHeight: 1.44
  seal:
    fontFamily: "Shippori Mincho B1 800 (outlined)"
    fontSize: "26-52 (SVG units)"
    fontWeight: 800
    lineHeight: 1.02
rounded:
  none: "0px"
  field-sm: "8px"
  field-lg: "10px"
  strip: "6px"
spacing:
  sheet-inset-x: "50px"
  sheet-inset-y: "40px"
  fold-sm: "92px"
  fold-lg: "118px"
  tab-fold: "18px"
components:
  field:
    backgroundColor: "{colors.ai-indigo}"
    rounded: "{rounded.field-sm}"
  kami-sheet:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.ai-deep}"
    rounded: "{rounded.none}"
  work-caption:
    backgroundColor: "{colors.ai-indigo}"
    textColor: "{colors.washi}"
    typography: "{typography.display}"
    padding: "0 50px"
  hanko:
    backgroundColor: "{colors.shu-vermilion}"
    textColor: "{colors.washi}"
    typography: "{typography.seal}"
  kirigami-strip:
    backgroundColor: "{colors.ai-indigo}"
    textColor: "{colors.washi}"
    typography: "{typography.label}"
    rounded: "{rounded.strip}"
    height: "60px"
  link-tab:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.ai-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "58px"
  band-tag:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.ai-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "24px"
  washi-panel:
    backgroundColor: "{colors.washi}"
    textColor: "{colors.ai-deep}"
    rounded: "{rounded.none}"
---

# Design System: Patrones de pliegue

## Overview

**Creative North Star: "The Two-Sided Kami"**

The profile is a folder of origami crease patterns (展開図). Every piece is cut from one sheet of two-sided kami: the indigo colored face is the field, carrying a tone-on-tone asanoha, and the washi reverse is the drawing surface where creases are printed in indigo ink. Each repository is designed as a model with the tree method (every file a flap circle, every folder a river band, gaps filled with rabbit-ear molecules) and printed in Yoshizawa–Randlett notation. The patterns regenerate from live repo trees on every Action run, so the drawings are folded from data, not illustrated.

The palette is paper, not pigment: two faces of the same sheet plus one seal ink. Vermilion appears only as hanko pressed in hakubun. Sheets sit tilted on the field with a folded corner that reveals a chiyogami face and a curved valley-fold arrow, so every work reads as a physical object about to be folded. Density is that of a real diagram: a dense crease pattern, a short caption, a single meta line that states what was drawn. Every Japanese label travels with its Spanish translation; Japanese is the notation, Spanish is the reading.

Confirmed refusals: the badge wall and stat cards, and the generic "Japanese" costume (cherry blossoms, rising-sun rays, red disc motifs).

**Key Characteristics:**
- Opaque objects only; one SVG serves GitHub's light and dark themes.
- Indigo field, washi drawing surface, indigo crease ink, vermilion only for hanko.
- Yoshizawa–Randlett notation used identically everywhere: valley dashed, mountain dash-dot-dot.
- Tilted sheets with folded corners, valley-fold arrows and a soft contact shadow.
- All text outlined to paths at build time; every large piece ships full and compact compositions.
- Every Japanese label paired with Spanish, in full and compact compositions alike.

## Colors

One two-sided sheet of indigo and washi, with a single vermilion seal ink.

### Primary
- **Ai Indigo** (`ai-indigo`): the colored face of the kami. Fills every field (header, works, footer), the kirigami strips, the folded-corner flaps under chiyogami, the small corner of each link tab, and the shading of tessellation twists and pleat bands.
- **Ai Deep** (`ai-deep`): crease ink. Every crease line, circle, flap dot and sheet border on washi, text on washi (link tabs, band tags, panels), the featured-band contour, and the tinted shadow under folded flaps.
- **Ai Tone** (`ai-tone`): the tone-on-tone asanoha stroke on the indigo field. Never used for text or creases.

### Tertiary
- **Shu Vermilion** (`shu-vermilion`): the hanko block only, with washi characters cut out of it (hakubun).

### Neutral
- **Washi** (`washi`): the reverse of the kami. Sheets, notation and tessellation panels, link tabs, band tags, twist centers; also all text set on the indigo field and the chiyogami line work on folded corners.

### Named Rules
**The Two Faces Rule.** Indigo is the colored face and the field; washi is the reverse and the drawing surface. Text on indigo is washi; text and creases on washi are Ai Deep. Hierarchy within crease work comes from opacity and stroke weight of the one ink, never from a new hue.

**The Seal Only Rule.** Vermilion exists only as a hanko block in hakubun. If something red is not a seal, it is wrong.

**The Opaque Object Rule.** Every piece carries its own indigo field or washi ground and a border where needed, so it holds its contrast on any GitHub theme. No transparent backgrounds, no `<picture>` theme switching.

## Typography

**Display / Label Font:** Zen Kaku Gothic New 900 (outlined)
**Body Font:** Zen Kaku Gothic New 500 (outlined)
**Seal Font:** Shippori Mincho B1 800 (outlined)

**Character:** A single Japanese gothic in two weights carries both scripts evenly, so kanji and Latin sit on one baseline; a heavy mincho is kept for the carved voice of seals and section kanji. All three are Google Fonts subsets (OFL), cut to the vocabulary actually used.

Sizes are SVG user units in each piece's own viewBox (header, notation, tessellation 1000 wide; works 600; footer 720). GitHub scales the image, which is why compact sizes are large.

### Hierarchy
- **Display** (900, 44-46 full, 70-82 compact, line step 1.05): the owner name in the header and each work title. Over-long strings shrink to fit. The largest type in any piece.
- **Label** (900, 14-22 full, 30-40 compact): meta lines, legend and panel titles, band tags (14), link-tab labels (21), the Spanish half of kirigami strips (22), compact captions.
- **Body** (500, 13-17 full, 34-44 compact, 23 line step on 16): roles, descriptions (max 3 lines), legend rows, seal translations, footer notes.
- **Seal** (Mincho 800, 26-52, column step 1.02): hanko characters set in vertical columns right to left, and the kanji of kirigami strips (26).

### Named Rules
**The Outlines Only Rule.** Text is typeset to glyph outlines at build time (one `<defs>` path per glyph, reused). An `<img>` SVG cannot load fonts; live `<text>` would fall back to system faces.

**The Paired Label Rule.** Every Japanese label is set beside its Spanish translation, joined by a middle dot (`谷折り · valle`, `作品 · Obras`, `二位 · 2.º puesto`), including in compact compositions.

**The Name Is The Headline Rule.** Nothing sits above a name or a work title; context lives in the legend, the caption below or the meta line.

## Layout

The README stacks pieces in GitHub Markdown: header full-width, intro text, a wrapping row of link tabs at 44px, section strips as `<h3>` images at 44px, works in a two-up grid at 49%, notation and tessellation panels full-width, footer centred at 520px.

The header splits a 1000 x 640 field: a 548 square washi sheet tilted -2° on the left two thirds, the name, roles, award seal and notation legend in a right column from x 618. Works are 600 x 820: a 500 square sheet inset 50 / 40, tilted ±1.4° alternating, caption block below from y 590 with a hairline (washi, 0.45 opacity) above the meta and seal lines.

Each large piece carries a full (`.f`) and a compact (`.c`) composition switched by `@media (max-width)` inside the SVG, measuring the rendered image width: works 330px, header, notation and tessellation 600px, footer 450px. Compact drops secondary text, enlarges the rest, hides hinge lines and thickens creases (valley 3, mountain 2.6, bisectors 2).

Crease patterns are capped at 30 flaps; the meta line states the drawn count (`… · 30 solapas en el patrón · …`). Numbers follow Spanish convention: no separator up to 9999, a plain space from 10 000.

## Elevation & Depth

Paper depth, softly lit. Sheets lift off the indigo field with a diffuse contact shadow and folded flaps cast a small shadow onto the sheet; everything else is flat overlap.

### Shadow Vocabulary
- **Contact** (`feDropShadow dx 0 dy 6 stdDeviation 7, #0B1830 at 0.45`): under every tilted washi sheet.
- **Flap** (`feDropShadow dx -2 dy 3 stdDeviation 3, ai-deep at 0.35`): under the folded corner flap only.

### Named Rules
**The Paper Light Rule.** Shadows are soft and belong to paper resting or folded: the contact shadow under a sheet and the flap shadow under a folded corner. Never a hard offset shadow, never a shadow on panels, tabs or strips.

## Shapes

Square paper. Sheets, panels, link tabs and band tags have square corners; only the indigo field rounds (8 on works and footer, 10 on the header) and the kirigami strip's left end (6). Recurring geometry is folding geometry: the folded corner (fold 92 on works, 118 on the header, 18 on link tabs), the arrow-pointed right end of kirigami strips, hishi diamonds cut from strips with a dashed center fold, flap circles, river bands, square twists. Hanko are near-square blocks (radius 0.12 of the glyph size) roughened by a fractal-noise mask so the ink prints unevenly.

## Components

### Kami Sheet (signature)
- **Character:** the account or a repo, drawn as a crease pattern on washi.
- **Shape:** square washi sheet, tilted (-2° header, ±1.4° works), one corner folded back. The flap shows the indigo face with chiyogami in washi line work, rotating per work: asanoha, seigaiha, kikkō. A dashed washi fold edge and a curved washi valley-fold arrow (2.2 stroke, round caps) mark the fold. Folded corners rotate tr, br, bl, tl across works.
- **Crease pattern:** river bands as Ai Deep discs at 0.06-0.17 opacity, flap circles (0.5 opacity stroke, 0.06 fill) with a 2.6 center dot, hinge lines 0.6 at 0.28 opacity, mountain 1.2 and valley 1.7 strokes, a 1.2 sheet border.
- **Featured bands (header):** a masked scalloped contour (the union of the band's discs minus its interior) in Ai Deep at 0.85, plus a washi band tag (1.3 Ai Deep border, label 14) kept clear of the seal zone.
- **Unpublished:** a preliminary base (diagonal valleys, cross mountains) with a washi panel «Patrón no publicado».

### Hanko
- **Character:** the only red; signature and distinctions.
- **Style:** vermilion block, washi characters in Shippori Mincho, columns right to left, slight rotation (-4° to 3°), noise-roughened. Name seal ダニエル on the header sheet and footer; distinction seals (二位, 論文, ハッカソン, 派生) on works, always with their Spanish line in the caption.

### Kirigami Strip
- **Character:** section titles cut from the indigo face.
- **Style:** indigo strip 60 tall, rounded left end, arrow-pointed right end; kanji in Seal 26, `· Spanish` in Label 22, a dashed washi fold, then three hishi diamond cut-outs with dashed center folds.

### Link Tab
- **Character:** a folded paper tab; the README's primary actions.
- **Style:** washi, 2.4 Ai Deep border, top-right corner folded (18) showing indigo, Label 21 in Ai Deep, drawn arrow for external links. 58 tall in its viewBox, shown at 44px.

### Work Caption
- Title in Display, description in Body (max 3 lines), a stick figure of the tree with «árbol» at right, hairline, meta line in Label (`language · N archivos · N solapas en el patrón · years`), then the seal pairing or repo URL in Body.

### Washi Panels (Notation, Tessellation)
- Washi ground with a 2 Ai Deep border. Notation: tree, circles, creases in three steps joined by outlined block arrows, numbered in ringed digits. Tessellation: 13 x 4 weeks of square twists over continuous valley/mountain pleat bands; twist angle 8-42° by the square root of the week's share of the peak; zero weeks stay flat.

### Footer
- Indigo field 720 x 150 with the name hanko, `折り紙 · origami`, and the build note.

## Do's and Don'ts

### Do:
- **Do** draw valley folds dashed (`7 4`) and mountain folds dash-dot-dot (`9 3 1.6 3 1.6 3`), the same in patterns, legends, notation and tessellation.
- **Do** keep creases and text on washi in Ai Deep, and text on the indigo field in washi.
- **Do** pair every Japanese label with its Spanish translation, in full and compact compositions.
- **Do** give each tilted sheet a folded corner with a curved valley-fold arrow and the soft contact shadow, rotating chiyogami asanoha, seigaiha, kikkō.
- **Do** cap crease patterns at 30 flaps and state the drawn count in the meta line.
- **Do** ship a full and a compact composition inside each large SVG (330 / 450 / 600).
- **Do** convert all text to outlines and shrink over-long strings to fit.

### Don't:
- **Don't** use vermilion for anything but hanko seals.
- **Don't** use rising-sun rays, red disc motifs, cherry blossoms or other generic "Japanese" costume.
- **Don't** put kickers, eyebrows or overlines above a name or title.
- **Don't** switch assets per theme with `<picture>`; each object carries its own ground.
- **Don't** use live `<text>` or web fonts inside the SVGs.
- **Don't** add hard offset shadows or shadows on flat pieces (panels, tabs, strips).
- **Don't** introduce a new hue for hierarchy; vary the one ink's weight and opacity.
