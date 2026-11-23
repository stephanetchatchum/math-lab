/**
 * Content model. Every topic is a TypeScript data file that exports a `Topic`.
 * Components never need to change to add a topic: visuals are declared as
 * `Scene`s (rendered by the generic SVG plotter) or as `SimDef`s (canvas).
 *
 * Rich text strings (`RichText`) support a tiny markup, parsed by richtext.ts:
 *   **bold**            emphasis
 *   {{tex|spoken}}      inline maths; the spoken form is REQUIRED
 *   [[term]]            glossary link (term id); [[term|shown words]]
 */

export type RichText = string;

/** Colour roles, used consistently across text, SVG, KaTeX and code. */
export type Role = 'active' | 'given' | 'result' | 'error' | 'done' | 'muted' | 'ink';

/** Display equation. `say` is what the reader speaks — never raw LaTeX. */
export interface Eq {
  tex: string;
  say: string;
  /** Optional label shown at the right, e.g. "definition". */
  label?: string;
}

// ---------------------------------------------------------------- scenes (SVG)

export type Pt = [number, number];

export type SceneItem =
  | { kind: 'fn'; f: (x: number) => number; role?: Role | QuantityClass; from?: number; to?: number; width?: number; dash?: boolean; samples?: number }
  | { kind: 'polyline'; points: Pt[]; role?: Role | QuantityClass; width?: number; dash?: boolean; closed?: boolean; fill?: boolean }
  | { kind: 'point'; at: Pt; role?: Role | QuantityClass; label?: string; r?: number; hollow?: boolean; labelDir?: 'ne' | 'nw' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' }
  | { kind: 'segment'; a: Pt; b: Pt; role?: Role | QuantityClass; width?: number; dash?: boolean; arrow?: boolean }
  | { kind: 'line'; through: Pt; slope: number; role?: Role | QuantityClass; width?: number; dash?: boolean }
  | { kind: 'vline'; x: number; role?: Role | QuantityClass; dash?: boolean; label?: string }
  | { kind: 'hline'; y: number; role?: Role | QuantityClass; dash?: boolean; label?: string }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; role?: Role | QuantityClass; opacity?: number }
  | { kind: 'area'; f: (x: number) => number; from: number; to: number; role?: Role | QuantityClass; opacity?: number }
  | { kind: 'label'; at: Pt; text: string; role?: Role | QuantityClass; size?: number; anchor?: 'start' | 'middle' | 'end'; hand?: boolean }
  | { kind: 'brace'; a: Pt; b: Pt; text: string; role?: Role | QuantityClass };

export interface Scene {
  x: [number, number];
  y: [number, number];
  /** Aspect: width/height of the drawing in px units (default 640x400). */
  size?: [number, number];
  axes?: boolean;
  grid?: boolean;
  xLabel?: string;
  yLabel?: string;
  /** Log10 axes for error plots. Values passed in are log10 values already. */
  logTicks?: { x?: boolean; y?: boolean };
  items: SceneItem[];
  /** Text alternative (accessibility). */
  alt: string;
}

/** Quantity colour classes, see quantities.ts */
export type QuantityClass = `q-${string}`;

// ---------------------------------------------------------------- animation

export interface Frame {
  scene: Scene;
  caption: string; // spoken when narration is on
  eq?: Eq;
}

export interface AnimationDef {
  id: string;
  title: string;
  frames: Frame[];
}

// ---------------------------------------------------------------- sandbox

export interface SliderParam {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  init: number;
  /** log slider: value = 10^raw */
  log?: boolean;
  role?: Role | QuantityClass;
  format?: (v: number) => string;
}
export interface ChoiceParam {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  init: string;
}
export interface DragPoint {
  id: string;
  label: string;
  init: Pt;
  role?: Role | QuantityClass;
  /** Snap/constrain a dragged point, e.g. onto a curve. */
  constrain?: (p: Pt, state: SandboxState) => Pt;
}
export interface SandboxState {
  values: Record<string, number>;
  choices: Record<string, string>;
  points: Record<string, Pt>;
}
export interface Readout {
  label: string;
  value: string;
  role?: Role | QuantityClass;
}
export interface SandboxDef {
  id: string;
  title: string;
  intro: RichText;
  sliders?: SliderParam[];
  choices?: ChoiceParam[];
  points?: DragPoint[];
  render: (s: SandboxState) => { scene: Scene; readouts?: Readout[]; note?: string; eq?: Eq };
  /** Optional second plot, e.g. the cost/accuracy meter. */
  meter?: (s: SandboxState) => MeterData;
  /** Things to try, each a short instruction. */
  tryThis: RichText[];
}

/** Cost / accuracy meter: error vs parameter on log-log axes, plus operation count. */
export interface MeterData {
  title: string;
  xLabel: string;
  yLabel: string;
  curves: { label: string; role: Role | QuantityClass; points: Pt[] }[]; // raw (not log) values
  marker?: { x: number; label: string };
  ops?: { label: string; value: number }[];
}

// ---------------------------------------------------------------- canvas sim

export interface SimDef<S = unknown> {
  id: string;
  title: string;
  init: (params: Record<string, number>) => S;
  step: (s: S, dt: number, params: Record<string, number>) => S;
  draw: (ctx: CanvasRenderingContext2D, s: S, w: number, h: number, colors: Record<string, string>) => void;
  params: SliderParam[];
  /** Analytic check for verify: returns error measure that must be < tol after `steps`. */
  check?: { steps: number; dt: number; measure: (s: S, params: Record<string, number>) => number; tol: number };
}

// ---------------------------------------------------------------- answers

export type Answer =
  | { kind: 'numeric'; value: number; relTol?: number; absTol?: number; unit?: string }
  | { kind: 'expr'; expr: string; vars: string[] }
  | { kind: 'mc'; options: RichText[]; correct: number; scenes?: Scene[] }
  | { kind: 'order'; steps: RichText[] }; // stored in correct order; shuffled for display

export interface Question {
  id: string;
  prompt: RichText;
  answer: Answer;
  /** Shown after answering. */
  explain: RichText;
}

export interface WorkedLine {
  tex: string;
  say: string;
  why: string; // justification, e.g. "used the chain rule"
}

export interface HandProblem {
  id: string;
  prompt: RichText;
  eq?: Eq;
  answer: Answer;
  hints: [RichText, RichText, RichText];
  solution: WorkedLine[];
  /** Machine-checkable final result of the worked solution (sympy expression or number). verify compares with `answer`. */
  solutionFinal: string;
  /**
   * Independent ground truth, computed by sympy in `npm run verify`
   * (e.g. "diff(x**2 - 3*x, x).subs(x, 2)"). Must equal both `answer` and `solutionFinal`.
   */
  truth?: string;
}

export interface CodeProblem {
  id: string;
  title: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prompt: RichText;
  starter: string;
  solution: string;
  /** Python: define functions named test_*; each asserts. Runs after the user's code in the same namespace. */
  tests: string;
  hints: [RichText, RichText, RichText];
  /** Identifier → colour class, so e.g. `dydx` shows in the slope colour. */
  colors?: Record<string, Role | QuantityClass>;
}

// ---------------------------------------------------------------- lesson

export type NoteKind = 'remember' | 'why' | 'pitfall' | 'intuition' | 'python' | 'compsci' | 'units';

export type Block =
  | { type: 'p'; text: RichText }
  | { type: 'eq'; eq: Eq }
  | { type: 'note'; kind: NoteKind; text: RichText }
  | { type: 'list'; items: RichText[] }
  | { type: 'figure'; scene: Scene; caption?: RichText }
  | { type: 'anim'; anim: AnimationDef }
  | { type: 'code'; code: string; say: string; colors?: Record<string, Role | QuantityClass> }
  | { type: 'table'; head: RichText[]; rows: RichText[][] };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

// ---------------------------------------------------------------- steps

export type StepKind =
  | 'hook' | 'learn' | 'watch' | 'recall' | 'play' | 'predict' | 'worked'
  | 'yourTurn' | 'compute' | 'fillGap' | 'used' | 'problems' | 'recap';

interface StepBase { id: string; kind: StepKind; title?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySim = SimDef<any>;

export interface HookStep extends StepBase { kind: 'hook'; question: RichText; scene?: Scene; anim?: AnimationDef; sim?: AnySim; teaser: RichText }
export interface LearnStep extends StepBase { kind: 'learn'; part: number; partCount: number; sections: Section[] }
export interface WatchStep extends StepBase { kind: 'watch'; intro: RichText; anims: AnimationDef[] }
export interface RecallStep extends StepBase { kind: 'recall'; questions: Question[] }
export interface PlayStep extends StepBase { kind: 'play'; sandbox: SandboxDef; sim?: AnySim }
export interface PredictStep extends StepBase {
  kind: 'predict';
  question: RichText;
  answer: Answer; // 'mc' or 'numeric'
  reveal: AnimationDef;
  explain: RichText;
}
export interface WorkedStep extends StepBase { kind: 'worked'; problem: RichText; eq?: Eq; lines: WorkedLine[]; takeaway: RichText }
export interface YourTurnStep extends StepBase { kind: 'yourTurn'; problems: HandProblem[] }
export interface ComputeStep extends StepBase { kind: 'compute'; problem: CodeProblem }
export interface FillGapStep extends StepBase {
  kind: 'fillGap';
  intro: RichText;
  mode: 'code' | 'derivation';
  /** Template with blanks written as ⟦id⟧. */
  template: string;
  blanks: { id: string; answers: string[]; check: 'exact' | 'expr'; vars?: string[]; width?: number; hint: RichText }[];
  /** For code: tests run on the filled-in code. */
  tests?: string;
}
export interface UsedStep extends StepBase { kind: 'used'; items: { field: string; title: string; text: RichText }[] }
export interface ProblemsStep extends StepBase {
  kind: 'problems';
  problems: CodeProblem[];
  outside: { source: string; item: string; why: string }[];
}
export interface RecapStep extends StepBase { kind: 'recap'; prompt: RichText; quiz: Question[] }

export type Step =
  | HookStep | LearnStep | WatchStep | RecallStep | PlayStep | PredictStep | WorkedStep
  | YourTurnStep | ComputeStep | FillGapStep | UsedStep | ProblemsStep | RecapStep;

// ---------------------------------------------------------------- topic / course

export interface Formula { name: string; tex: string; say: string; section?: string }
export interface GlossaryEntry { id: string; term: string; def: RichText; topic?: string }

export interface TopicMeta {
  id: string; // globally unique, e.g. "calc-derivative"
  course: string;
  number: string; // "1.2"
  title: string;
  blurb: string;
  icon: string;
  prereqs: string[];
}

export interface Topic extends TopicMeta {
  steps: Step[];
  formulas: Formula[];
  glossary?: GlossaryEntry[];
}

export interface CompareTable {
  id: string;
  title: string;
  intro: RichText;
  head: RichText[];
  rows: RichText[][];
}

export interface Course {
  id: string;
  number: number;
  title: string;
  blurb: string;
  /** Step kinds switched off for every topic in this course. */
  disabledSteps?: StepKind[];
  /** Per-topic switches. */
  topicStepOverrides?: Record<string, StepKind[]>;
  topics: TopicMeta[];
  compare?: CompareTable[];
}

export const STEP_LABEL: Record<StepKind, string> = {
  hook: 'Hook',
  learn: 'Learn the concept',
  watch: 'Watch it',
  recall: 'Quick recall',
  play: 'Play with it',
  predict: 'Predict, then reveal',
  worked: 'Worked example',
  yourTurn: 'Your turn',
  compute: 'Compute it',
  fillGap: 'Fill the gap',
  used: 'Where it’s used',
  problems: 'Problems',
  recap: 'Recap',
};
