---
name: Herbario de repositorios
description: GitHub profile README for danieln3m0, shipped as pressed-herbarium SVG objects generated from live repo trees.
colors:
  folder-vermilion: "#B42318"
  folder-tab-deep: "#8E1A12"
  mounting-sheet: "#EDF0EA"
  specimen-ink: "#14261C"
typography:
  display:
    fontFamily: "Libre Franklin (outlined), 800"
    fontSize: "40-52px full; 66-84px compact"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.01em"
  caps:
    fontFamily: "Libre Franklin (outlined), 600"
    fontSize: "12-22px full; 24-34px compact"
    fontWeight: 600
    letterSpacing: "0.14em"
  typed:
    fontFamily: "Courier Prime (outlined), 400"
    fontSize: "13-16px full; 34-44px compact"
    fontWeight: 400
    lineHeight: 1.3
  typed-bold:
    fontFamily: "Courier Prime (outlined), 700"
    fontSize: "15-15.5px full; 34-40px compact"
    fontWeight: 700
  binomial:
    fontFamily: "Libre Caslon Text Italic (outlined)"
    fontSize: "19-20px"
    fontWeight: 400
rounded:
  none: "0px"
  sheet: "2px"
  folder-sm: "8px"
  folder-lg: "10px"
  tab: "14px"
spacing:
  rule-inset: "6px"
  label-pad: "20px"
  sheet-inset-sm: "12px"
  sheet-inset-lg: "26px"
components:
  folder:
    backgroundColor: "{colors.folder-vermilion}"
    rounded: "{rounded.folder-sm}"
  folder-tab:
    backgroundColor: "{colors.folder-tab-deep}"
    textColor: "{colors.mounting-sheet}"
    typography: "{typography.caps}"
    rounded: "{rounded.tab}"
  section-tab:
    backgroundColor: "{colors.folder-vermilion}"
    textColor: "{colors.mounting-sheet}"
    typography: "{typography.caps}"
    rounded: "{rounded.tab}"
    height: "60px"
  mounting-sheet:
    backgroundColor: "{colors.mounting-sheet}"
    rounded: "{rounded.sheet}"
  determination-label:
    backgroundColor: "{colors.mounting-sheet}"
    textColor: "{colors.specimen-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "20px"
  link-tag:
    backgroundColor: "{colors.mounting-sheet}"
    textColor: "{colors.specimen-ink}"
    typography: "{typography.display}"
    height: "58px"
  annotation-slip:
    backgroundColor: "{colors.mounting-sheet}"
    textColor: "{colors.specimen-ink}"
    typography: "{typography.typed}"
    rounded: "{rounded.none}"
---

# Design System: Herbario de repositorios

## Overview

**Creative North Star: "The Pressed Specimen"**

The profile is a herbarium. Each repository is pressed onto a cool white mounting sheet as a plant drawn from its real file tree (stem = repo root, branches = directories, leaves = files, roots = loose root files), filed inside a vermilion type folder, and labelled like a museum specimen: a ruled determination label, typewritten collector data, an italic binomial, an accession barcode, linen tape strips and rubber stamps. Everything is a physical object with an opaque ground, so the same SVG reads identically on GitHub's light and dark themes; there is no theme switching.

The system is two inks and one accent material. Specimen ink does all the drawing and writing; vermilion is reserved for the folder that holds the sheet and for the rubber stamps pressed on it. Density is that of a real sheet: a large, quiet plant, a compact label in the corner, small typed annotations. The specimens are deterministic and regenerate from live data every Action run, so the world is grown, not illustrated.

**Key Characteristics:**
- Opaque physical objects (folder, sheet, label, slip, tag); one asset per piece serves both GitHub themes.
- Two inks, no greys: specimen ink on mounting sheet, vermilion only on folders, tabs and stamps.
- All text is converted to outlines at build time.
- Every large piece ships a full and a compact composition inside the same SVG.
- Plants are generated deterministically from file trees; leaf shape encodes file kind.
- One motion only: a one-time stem draw on the header.

## Colors

A vermilion type folder around a cool, faintly green mounting sheet, drawn on in a single deep green-black ink.

### Primary
- **Folder Vermilion** (`folder-vermilion`): the body of every type folder (header, specimens), the section tabs between README sections, and every rubber stamp (ring and box), stroke and text. Never used for drawing, labels or body text.
- **Folder Tab Deep** (`folder-tab-deep`): the tab of a folder that sits behind the folder body (header and specimen tabs), so the tab reads as the back flap. Section tabs that stand alone use Folder Vermilion.

### Neutral
- **Mounting Sheet** (`mounting-sheet`): the sheet inside the folder and the ground of every label, slip, tape strip, link tag and panel; also the knock-out colour for tab text and leaf veins. Cool, never cream.
- **Specimen Ink** (`specimen-ink`): every stem, leaf, root, rule, border, barcode and line of text on the sheet.

### Named Rules
**The Two Inks Rule.** On the sheet there is specimen ink and there is paper. No greys, no tints, no opacity ramps for hierarchy; hierarchy comes from type face, size and stroke weight.

**The Folder-And-Stamp Rule.** Red appears only as folder material (bodies and tabs) and rubber-stamp ink. If something red is neither a folder nor a stamp, it is wrong.

**The Opaque Object Rule.** Every piece has its own opaque ground (folder or sheet), so it carries its own contrast to any GitHub theme. No transparent backgrounds, no `<picture>` theme variants.

## Typography

**Display Font:** Libre Franklin 800 (outlined)
**Institution Caps:** Libre Franklin 600, uppercase, tracked (outlined)
**Collector Data:** Courier Prime 400 / 700 (outlined)
**Binomial:** Libre Caslon Text Italic (outlined)

**Character:** Franklin gothic for the institution and the determination, typewriter for everything a collector would type, and a single italic serif for the Latin binomial: the voice of a herbarium label set in one pass.

Sizes are SVG user units in each piece's own viewBox (header and panels 1000 wide, specimens 600, footer 720); GitHub scales the whole image, which is why compact sizes are large.

### Hierarchy
- **Display** (800, 40-52 full / 66-84 compact, tracking -0.01em, leading 0.98): the name on a determination label (owner name, repo title) and link-tag labels at 21 with +0.06em. The largest type in any piece.
- **Caps** (600, 12-22 full, tracking 0.12-0.16em; 24-34 compact, tracking 0.04-0.08em): institution and folder-tab lines, panel titles, month marks, leaf-key labels, the arc text of ring stamps.
- **Binomial** (Caslon italic, 19-20): the invented Latin name directly under the display name, followed by a typed author abbreviation.
- **Typed** (Courier Prime 400, 13-16): descriptions, collector lines, origin slips, barcode captions, footer notes.
- **Typed Bold** (Courier Prime 700, 15-15.5): the bottom meta line of a label (language · files · years) and branch tags on the header plant.

### Named Rules
**The Outlines Only Rule.** Text is typeset to glyph outlines at build time (one `<defs>` path per glyph, reused). An `<img>` SVG cannot load fonts; live `<text>` would fall back to system faces.

**The Fit Not Squeeze Rule.** Over-long strings shrink their size to fit the measure; tracking is never tightened and letters on a stamp arc are never crowded.

**The Name Is The Headline Rule.** No kicker, eyebrow or overline above a name. The institution line lives on the folder tab, never on the label.

## Layout

Every large piece is a fixed-viewBox composition modelled on a herbarium sheet: plant in the left or upper field, accession barcode top right, determination label bottom right, stamps overlapping a label or sheet edge. The README stacks pieces full-width (header, key, phenology) or in a two-up grid at 49% (specimens), with section tabs as `<h3>` images at 40px height and link tags at 44px height in a wrapping row.

Each large piece carries two compositions, the full one (`.f`) and a compact one (`.c`), switched by an `@media (max-width)` inside the SVG that measures the rendered image width: specimens at 330px, header, phenology and leaf key at 600px, footer at 450px. The compact composition drops secondary text, enlarges the remaining type to stay legible at 170-340px wide, thickens stems (10 / 6.5 / 4.5 / 3.2 by depth) and outlines leaves so the silhouette survives.

Rhythm inside pieces: 6px between a label's outer border and its inner rule, 20px label padding, sheet inset 12px (specimen) or 26px (header) from the folder edge.

Numbers follow Spanish convention: no separator up to 9999, a plain space from 10 000 (`10 000`).

## Elevation & Depth

Flat. There are no shadows anywhere. Depth is physical layering of flat objects: folder under sheet, sheet under label, tape strips over stems, stamps over label edges at a slight rotation, a tab flap in a darker red behind the folder body.

### Named Rules
**The Paper Stack Rule.** Depth comes only from overlap, rotation (stamps -8 to -14 degrees, envelopes -3) and the darker back tab. Never a drop shadow, never a hard offset shadow.

## Shapes

Mostly square paper. Labels, slips, tape and panels have square corners and ink borders; the determination label and panels use a double rule (2.2 outer, 0.8 inner, 6 apart), compact labels a single heavy border (5-6). Folders have softened corners (8 specimen, 10 header) and the sheet a barely-there 2. The folder tab is the only distinctly rounded form (14 top corners). Link tags are shipping tags: a clipped left end and a reinforced eyelet ring. Ring stamps are double circles; box stamps are double rectangles; both carry a fractal-noise mask so the ink is uneven like rubber.

## Components

### Folder
- **Character:** the vermilion type folder that holds a sheet.
- **Shape:** folder body with 8-10 corners; back tab in Folder Tab Deep with 14 corners, carrying the family or institution line in paper-coloured caps.
- **Content:** tab text is the genus folder: the repo language or family on specimens, `HERBARIO DE REPOSITORIOS · DANIELN3M0` on the header (only `DANIELN3M0` in compact).

### Section Tab
- **Character:** a standalone folder tab that titles a README section (Ejemplares tipo, Fenología, Anotaciones, Índice de familias).
- **Style:** Folder Vermilion, 60 tall, 14 top corners, caps 22 at +0.14em in paper.

### Determination Label
- **Character:** the specimen's identity card.
- **Style:** paper ground, double ink rule, 20 padding. Display name, then italic binomial, then typed description (max 4 lines), then a hairline and the typed-bold meta line.
- **Compact:** single heavy border, giant name, one short typed line, one bold meta line.

### Link Tag
- **Character:** a shipping tag with eyelet; the README's primary actions.
- **Style:** paper ground, 2.4 ink border, clipped left corners, eyelet ring, display caps 21 at +0.06em, a drawn arrow for external links. 58 tall in its viewBox, shown at 44px.

### Rubber Stamp
- **Character:** the only red on the sheet; awards and provenance.
- **Ring:** double circle (3.5 / 1.6), caps text on the arc, display year in the centre. **Box:** double rectangle, stacked display caps. Both at 0.93 opacity, rotated, roughened by the noise mask, overlapping a label or sheet edge.

### Plant (signature)
- **Character:** the file tree as a pressed plant, deterministic per repo.
- **Grammar:** stem = root, branches = directories (heaviest lowest, alternating), leaves = files, roots = loose root files. Leaf form by kind: lanceolate = code, ovate outline = markup, round = config, flower = docs, berry = assets, bud = tests. Stem width decays 0.66 per depth. Linen tape strips (paper, 0.9 ink border) hold the main stems. The header plant adds dashed-thread branch tags in typed bold.

### Accession Barcode & Origin Slip
- Code 39 barcode in ink with typed caption `N.º 00X`, top right of every sheet. The origin slip is a thin-bordered typed box with the repo URL, top left.

### Panels (Leaf Key, Phenology, Footer)
- Paper ground, 2.2 ink border (footer adds the inner rule), caps title over a hairline. Phenology draws one plant per week on a runner stem in four discrete levels: node, bud, half-open flower, open flower.

### Motion
- One-time stem draw on the header only: stems animate `stroke-dashoffset` over 1.2s, leaves fade in over 0.7s, both `cubic-bezier(.22,1,.36,1)`, staggered by growth order. Disabled under `prefers-reduced-motion: reduce`. Specimens and panels are static.

## Do's and Don'ts

### Do:
- **Do** keep every piece an opaque object with its own folder or sheet ground, so one asset works on both GitHub themes.
- **Do** draw and write everything on the sheet in Specimen Ink; use red only for folders, tabs and stamps.
- **Do** convert all text to outlines and let over-long strings shrink to fit rather than tighten.
- **Do** ship a full and a compact composition inside each large SVG, switched by the image-width media query (330 / 450 / 600).
- **Do** generate plants from real file trees with a fixed seed so the same repo always grows the same plant.
- **Do** put the institution or family line on the folder tab.
- **Do** format numbers the Spanish way: `9999`, `10 000`.

### Don't:
- **Don't** introduce greys, tints or a third ink for hierarchy.
- **Don't** put kickers, eyebrows or overlines above a name.
- **Don't** add shadows of any kind; depth is overlap and rotation.
- **Don't** use live `<text>` or web fonts inside the SVGs.
- **Don't** switch assets per theme with `<picture>`; the object carries its own ground.
- **Don't** animate anything but the header's one-time stem draw, and never without the reduced-motion guard.
- **Don't** warm the sheet toward cream.
