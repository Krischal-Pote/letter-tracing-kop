import { type Stroke } from "./letters.js";
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
    onComplete?: (r: {
        accuracy: number;
        time: number;
    }) => void;
}
export declare function speak(text: string, lang?: string): void;
export declare function say(text: string, audioSrc?: string, lang?: string): void;
export declare function LetterTracer({ letter, strokes, size, strokeColor, guideColor, tolerance, threshold, enforceOrder, showGuides, speakText, audioSrc, speakLang, speakOnStart, showStrokeDemo, cursor, guideStyle, dotColor, showHints, celebrate, onProgress, onComplete, }: LetterTracerProps): import("react").JSX.Element;
export interface LetterTracerGameProps extends Omit<LetterTracerProps, "letter" | "strokes" | "speakText" | "audioSrc"> {
    /** letters to play through; default A–Z */
    letters?: string[];
    /** per-letter spoken text, e.g. { A: "A for Apple" } */
    speakTexts?: Record<string, string>;
    /** per-letter audio file, e.g. { A: "/sounds/a.mp3" } */
    audioSrcs?: Record<string, string>;
    /** ms to wait after a letter is done before moving on */
    advanceDelay?: number;
    onFinish?: (results: {
        letter: string;
        accuracy: number;
        time: number;
    }[]) => void;
}
export declare function LetterTracerGame({ letters, speakTexts, audioSrcs, advanceDelay, onFinish, onComplete, ...rest }: LetterTracerGameProps): import("react").JSX.Element | null;
