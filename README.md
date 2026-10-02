# letter-tracing-kop

React letter-tracing component for kids. Mouse, touch and stylus input, stroke order, accuracy score, spoken letters, stroke-demo animation, and a ready-made A–Z game. Zero dependencies (React is a peer).

**[Live demo](https://letter-tracing-94pgeqjco-krischalpotes-projects.vercel.app/)**

## Install

```bash
npm install letter-tracing-kop
```

## Quick start

```tsx
import { LetterTracer } from "letter-tracing-kop";

<LetterTracer
  letter="A"
  speakText="A for Apple"
  showStrokeDemo
  onComplete={({ accuracy, time }) => alert(`Done! ${accuracy}% in ${time / 1000}s`)}
/>
```

## Examples

### Custom recorded voice (e.g. a teacher, or another language)

```tsx
<LetterTracer letter="A" audioSrc="/sounds/a.mp3" />
```

### Built-in speech in another language

```tsx
<LetterTracer letter="A" speakText="ए" speakLang="ne-NP" />
```

Speech voices depend on the device; if the language isn't installed, use `audioSrc`.

### Full A–Z game

```tsx
import { LetterTracerGame } from "letter-tracing-kop";

<LetterTracerGame
  showStrokeDemo
  speakTexts={{ A: "A for Apple", B: "B for Ball" }}
  audioSrcs={{ C: "/sounds/c.mp3" }}
  onFinish={(results) => console.log(results)} // [{ letter, accuracy, time }]
/>
```

### Custom letters / shapes

```tsx
// polylines in a 100x100 box, y points down
<LetterTracer strokes={[[[20, 80], [50, 20], [80, 80]]]} />
```

## `<LetterTracer>` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `letter` | `string` | `"A"` | Key in `LETTERS` (A–Z, 0–9) |
| `strokes` | `Stroke[]` | – | Custom polylines; overrides `letter` |
| `size` | `number` | `400` | Width/height in px |
| `strokeColor` | `string` | `#22c55e` | Colour of the child's trace |
| `guideColor` | `string` | `#d1d5db` | Colour of the guide path |
| `tolerance` | `number` | `8` | Distance from path (0–100 box) counted as on-path |
| `threshold` | `number` | `0.9` | Fraction of a stroke to cover to finish it |
| `enforceOrder` | `boolean` | `true` | Only the first unfinished stroke can be traced |
| `showGuides` | `boolean` | `true` | Draw the grey guide |
| `celebrate` | `boolean` | `false` | On finish: 1–3 ⭐ by accuracy (≥90 / ≥70), confetti, spoken "Great job!" |
| `showStrokeDemo` | `boolean` | `false` | Animate a 👆 along the strokes once on mount |
| `cursor` | `string` | `crosshair` | Any CSS cursor (`pointer`, `grab`…) or your own image: `"/pen.png"` |
| `showHints` | `boolean` | `true` | Pen lifted before the letter is done: missed dots pulse orange and 👆 glides along the rest of the stroke on a dashed orange path, looping |
| `dotColor` | `string` | `#000` | Colour of the guide dots (they turn `strokeColor` when traced) |
| `guideStyle` | `"both" \| "dots" \| "line"` | `both` | `both`: grey letter shape + black dots that turn green when hit; `dots`: dots only; `line`: grey band only. Traced parts fill with `strokeColor` in all modes |
| `speakText` | `string` | the letter | Text spoken via Web Speech API |
| `audioSrc` | `string` | – | Audio file URL; overrides speech |
| `speakLang` | `string` | browser default | BCP-47 code, e.g. `ne-NP` |
| `speakOnStart` | `boolean` | `true` | Speak/play on mount |
| `onProgress` | `(pct: number) => void` | – | 0–100 overall progress |
| `onComplete` | `({ accuracy, time }) => void` | – | `accuracy` %, `time` ms |

## `<LetterTracerGame>` props

Accepts all `LetterTracer` props except `letter`, `strokes`, `speakText`, `audioSrc`, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `letters` | `string[]` | A–Z | Letters to play through |
| `speakTexts` | `Record<string, string>` | – | Per-letter spoken text |
| `audioSrcs` | `Record<string, string>` | – | Per-letter audio file |
| `advanceDelay` | `number` | `1200` | ms before moving to the next letter |
| `onFinish` | `(results) => void` | – | Called after the last letter |

## Exports

| Export | Description |
|---|---|
| `LetterTracer`, `LetterTracerGame` | Components |
| `LETTERS` | Stroke data (`Record<string, Stroke[]>`) |
| `speak(text, lang?)`, `say(text, audioSrc?, lang?)` | Audio helpers |
| `Stroke`, `Point` | Types |

## Letter coverage

| Set | Status |
|---|---|
| A–Z | Included |
| 0–9 | Starter data, approximate shapes |
| a–z, other scripts | Not yet; PRs welcome |

## Try it locally

```bash
npm run build && npx serve .   # open /demo/
```

## License

MIT
