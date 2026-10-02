import { useMemo, useRef, useState, useEffect, type PointerEvent } from "react";
import { LETTERS, type Stroke } from "./letters.js";

export { LETTERS } from "./letters.js";
export type { Stroke, Point } from "./letters.js";

export interface LetterTracerProps {
  letter?: string;
  /** custom strokes (100x100 box); overrides `letter` */
  strokes?: Stroke[];
  size?: number;
  strokeColor?: string;
  guideColor?: string;
  /** distance from path (in 100-unit box) that counts as on-path */
  tolerance?: number;
  /** fraction of a stroke that must be covered to finish it */
  threshold?: number;
  enforceOrder?: boolean;
  showGuides?: boolean;
  /** text spoken on mount (default: the letter itself) */
  speakText?: string;
  /** recorded audio file; takes priority over speech synthesis */
  audioSrc?: string;
  /** BCP-47 language for speech, e.g. "ne-NP" */
  speakLang?: string;
  speakOnStart?: boolean;
  /** CSS cursor over the canvas: "crosshair", "pointer", or an image URL/path like "/pen.png" */
  cursor?: string;
  /** "both" = grey letter shape + dots that turn green when traced; "dots" = dots only; "line" = solid band that fills green */
  /** after the pen lifts mid-letter, pulse the missed dots and point 👆 at the next one */
  showHints?: boolean;
  /** colour of the guide dots */
  dotColor?: string;
  guideStyle?: "both" | "dots" | "line";
  /** stars + confetti + spoken praise when the letter is finished */
  celebrate?: boolean;
  /** animate the pen path once on mount */
  showStrokeDemo?: boolean;
  onProgress?: (pct: number) => void;
  onComplete?: (r: { accuracy: number; time: number }) => void;
}

export function speak(text: string, lang = "en-US") {
  if (typeof speechSynthesis === "undefined") return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.8;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export function say(text: string, audioSrc?: string, lang?: string) {
  if (audioSrc) new Audio(audioSrc).play().catch(() => {});
  else speak(text, lang);
}

// sample every ~step units along each polyline
function densify(stroke: Stroke, step = 2): Stroke {
  const out: Stroke = [stroke[0]];
  for (let i = 1; i < stroke.length; i++) {
    const [x0, y0] = stroke[i - 1], [x1, y1] = stroke[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

export function LetterTracer({
  letter = "A", strokes, size = 400, strokeColor = "#22c55e", guideColor = "#d1d5db",
  tolerance = 8, threshold = 0.9, enforceOrder = true, showGuides = true,
  speakText, audioSrc, speakLang, speakOnStart = true, showStrokeDemo = false, cursor = "crosshair", guideStyle = "both", dotColor = "#000", showHints = true, celebrate = false, onProgress, onComplete,
}: LetterTracerProps) {
  const dense = useMemo(
    () => (strokes ?? LETTERS[letter.toUpperCase()] ?? []).map((s) => densify(s)),
    [strokes, letter],
  );
  const covered = useRef<boolean[][]>([]);
  const stats = useRef({ on: 0, off: 0, t0: 0, done: false });
  const drawing = useRef(false);
  const [trace, setTrace] = useState<string>("");
  const [, tick] = useState(0);
  const [stars, setStars] = useState(0);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    covered.current = dense.map((s) => s.map(() => false));
    stats.current = { on: 0, off: 0, t0: 0, done: false };
    setTrace("");
    setStars(0);
    setHint(false);
    tick((n) => n + 1);
    if (speakOnStart) say(speakText ?? letter, audioSrc, speakLang);
  }, [dense]); // eslint-disable-line react-hooks/exhaustive-deps

  const frac = (i: number) => {
    const c = covered.current[i] ?? [];
    return c.length ? c.filter(Boolean).length / c.length : 1;
  };

  const point = (e: PointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100];
  };

  const hit = (x: number, y: number) => {
    const s = stats.current;
    if (!s.t0) s.t0 = Date.now();
    // enforceOrder: only the first unfinished stroke is paintable
    const cur = enforceOrder ? dense.findIndex((_, i) => frac(i) < threshold) : -1;
    let onPath = false;
    dense.forEach((st, i) => {
      if (cur >= 0 && i !== cur) return;
      st.forEach(([px, py], j) => {
        if (Math.hypot(px - x, py - y) <= tolerance) {
          covered.current[i][j] = true;
          onPath = true;
        }
      });
    });
    onPath ? s.on++ : s.off++;
    const pct = dense.length ? (dense.reduce((a, _, i) => a + Math.min(1, frac(i) / threshold), 0) / dense.length) * 100 : 0;
    onProgress?.(Math.round(pct));
    if (!s.done && dense.length && dense.every((_, i) => frac(i) >= threshold)) {
      s.done = true;
      const accuracy = Math.round((s.on / (s.on + s.off)) * 100);
      if (celebrate) {
        setStars(accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1);
        say("Great job!", undefined, speakLang);
      }
      onComplete?.({ accuracy, time: Date.now() - s.t0 });
    }
    tick((n) => n + 1);
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    setHint(false);
    const [x, y] = point(e);
    setTrace(`M${x} ${y}`);
    hit(x, y);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const [x, y] = point(e);
    setTrace((t) => `${t} L${x} ${y}`);
    hit(x, y);
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setHint(true);
  };

  // strokes to hint at: first unfinished one (enforceOrder) or all unfinished
  const firstOpen = dense.findIndex((_, i) => frac(i) < threshold);
  const hinted = (i: number) => hint && showHints && firstOpen >= 0 && (enforceOrder ? i === firstOpen : frac(i) < threshold);
  // remaining path of the current stroke, from the first missed dot to the end
  const rest = hinted(firstOpen)
    ? dense[firstOpen].slice(Math.max(0, covered.current[firstOpen].findIndex((c) => !c)))
    : undefined;

  const d = (s: Stroke) => "M" + s.map(([x, y]) => `${x} ${y}`).join(" L");

  return (
    <svg
      viewBox="0 0 100 100" width={size} height={size}
      style={{ touchAction: "none", cursor: /[/.]/.test(cursor) ? `url("${cursor}") 0 0, auto` : cursor }}
      onPointerDown={down} onPointerMove={move}
      onPointerUp={up} onPointerCancel={up}
    >
      {showGuides && guideStyle !== "dots" && dense.map((s, i) => (
        <path key={i} d={d(s)} fill="none" stroke={guideColor} strokeWidth={tolerance * 1.2} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {guideStyle !== "dots" && dense.map((s, i) => s.map(([x, y], j) => covered.current[i]?.[j] && <circle key={`${i}-${j}`} cx={x} cy={y} r={tolerance * 0.6} fill={strokeColor} opacity={0.35} />))}
      {showGuides && guideStyle !== "line" && dense.map((s, i) => s.map(([x, y], j) => (
        // ponytail: dot every 3rd sample (~6 units), hardcoded; make a prop if needed
        (j % 3 === 0 || j === s.length - 1) && (covered.current[i]?.[j]
          ? <circle key={`${i}-${j}`} cx={x} cy={y} r={tolerance * 0.35} fill={strokeColor} />
          : hinted(i)
            ? <circle key={`${i}-${j}`} cx={x} cy={y} r={tolerance * 0.3} fill="#f59e0b">
                <animate attributeName="r" values={`${tolerance * 0.25};${tolerance * 0.5};${tolerance * 0.25}`} dur="0.9s" repeatCount="indefinite" />
              </circle>
            : <circle key={`${i}-${j}`} cx={x} cy={y} r={tolerance * 0.25} fill={dotColor} />)
      )))}
      {showStrokeDemo && dense.map((s, i) => (
        <path key={`demo-${letter}-${i}`} d={d(s)} pathLength={1} strokeDasharray={1} strokeDashoffset={1}
          fill="none" stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1s" begin={`${i * 1.2}s`} fill="freeze" />
          <set attributeName="opacity" to="0" begin={`${i * 1.2 + 1.2}s`} fill="freeze" />
        </path>
      ))}
      {showStrokeDemo && dense.map((s, i) => (
        <text key={`finger-${letter}-${i}`} fontSize={14} textAnchor="middle" y={12} opacity={0}>
          👆
          <set attributeName="opacity" to="1" begin={`${i * 1.2}s`} fill="freeze" />
          <animateMotion path={d(s)} dur="1s" begin={`${i * 1.2}s`} fill="freeze" />
          <set attributeName="opacity" to="0" begin={`${i * 1.2 + 1.1}s`} fill="freeze" />
        </text>
      ))}
      {rest && rest.length > 1 && (
        <g key={`hint-${firstOpen}-${rest.length}`} pointerEvents="none">
          <path d={d(rest)} pathLength={1} strokeDasharray="0.04 0.04" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
          <text fontSize={14} textAnchor="middle" y={12}>
            👆
            <animateMotion path={d(rest)} dur={`${Math.max(1, rest.length * 0.03)}s`} repeatCount="indefinite" />
          </text>
        </g>
      )}
      {stars > 0 && (
        <g pointerEvents="none">
          {Array.from({ length: 24 }, (_, k) => (
            <circle key={k} cx={(k * 37) % 100} cy={-5} r={2} fill={["#f59e0b", "#ef4444", "#10b981", "#3b82f6"][k % 4]}>
              <animate attributeName="cy" from="-5" to="105" dur={`${1.2 + (k % 5) * 0.2}s`} begin={`${(k % 6) * 0.1}s`} fill="freeze" />
            </circle>
          ))}
          {[0, 1, 2].map((k) => (
            <text key={k} x={30 + k * 20} y={55} fontSize={18} textAnchor="middle" opacity={0}>
              {k < stars ? "⭐" : "☆"}
              <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${k * 0.25}s`} fill="freeze" />
            </text>
          ))}
        </g>
      )}
      <path d={trace} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface LetterTracerGameProps extends Omit<LetterTracerProps, "letter" | "strokes" | "speakText" | "audioSrc"> {
  /** letters to play through; default A–Z */
  letters?: string[];
  /** per-letter spoken text, e.g. { A: "A for Apple" } */
  speakTexts?: Record<string, string>;
  /** per-letter audio file, e.g. { A: "/sounds/a.mp3" } */
  audioSrcs?: Record<string, string>;
  /** ms to wait after a letter is done before moving on */
  advanceDelay?: number;
  onFinish?: (results: { letter: string; accuracy: number; time: number }[]) => void;
}

const AZ = Object.keys(LETTERS).filter((k) => /^[A-Z]$/.test(k));

export function LetterTracerGame({
  letters = AZ, speakTexts, audioSrcs, advanceDelay = 1200, onFinish, onComplete, ...rest
}: LetterTracerGameProps) {
  const [i, setI] = useState(0);
  const results = useRef<{ letter: string; accuracy: number; time: number }[]>([]);
  const letter = letters[i];
  if (!letter) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <div>{letter} &middot; {i + 1}/{letters.length}</div>
      <LetterTracer
        key={letter} {...rest} letter={letter}
        speakText={speakTexts?.[letter]} audioSrc={audioSrcs?.[letter]}
        onComplete={(r) => {
          onComplete?.(r);
          results.current.push({ letter, ...r });
          setTimeout(() => (i + 1 < letters.length ? setI(i + 1) : onFinish?.(results.current)), advanceDelay);
        }}
      />
    </div>
  );
}
