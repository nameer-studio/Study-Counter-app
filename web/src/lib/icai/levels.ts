import type { PaperSeed } from "@/lib/icai/foundation";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import { FINAL_PAPERS } from "@/lib/icai/final";
import type { IcaiLevel } from "@/lib/domain/types";

/**
 * Paper definitions for all three ICAI levels (New Scheme).
 *
 * ⚠️ **Intermediate** still carries no chapter data — only paper identity, group and
 * marking flags. Foundation and Final are seeded (see icai/foundation.ts and
 * icai/final.ts). Screens must keep handling an empty `chapters` array honestly rather
 * than rendering as if the syllabus were complete, since Intermediate still hits that
 * path — `hasSyllabusData` is the check.
 *
 * Paper names here follow the **New Scheme** as confirmed in PLAN.md §2 — note these
 * differ from the placeholder names in the Block 1 design mockup, which showed older
 * pre-2023 Final papers (e.g. "Corp & Econ Laws"). The confirmed data wins.
 */

export interface LevelPapers {
  level: IcaiLevel;
  label: string;
  hasGroups: boolean;
  papers: PaperSeed[];
}

/** Group I = papers 1–3, Group II = papers 4–6, at both Inter and Final. */
export function groupOf(paperNo: number): 1 | 2 {
  return paperNo <= 3 ? 1 : 2;
}

const INTERMEDIATE_PAPERS: PaperSeed[] = [
  { id: "int-p1", paperNo: 1, name: "Advanced Accounting", category: "accounts", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "int-p2", paperNo: 2, name: "Corporate and Other Laws", category: "law", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "int-p3", paperNo: 3, name: "Taxation", category: "tax", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "int-p4", paperNo: 4, name: "Cost and Management Accounting", category: "costing", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "int-p5", paperNo: 5, name: "Auditing and Ethics", category: "audit", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "int-p6", paperNo: 6, name: "Financial Management & Strategic Management", category: "fmsm", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
];

// Final's papers (with chapter data) live in icai/final.ts. Note on colour: Final has
// two tax papers but only six palette colours, so Indirect Tax borrows the law colour to
// keep all six visually distinct — that's chart legibility, not a claim about subject
// grouping.

export const LEVELS: Record<IcaiLevel, LevelPapers> = {
  foundation: { level: "foundation", label: "Foundation", hasGroups: false, papers: FOUNDATION_PAPERS },
  intermediate: { level: "intermediate", label: "Intermediate", hasGroups: true, papers: INTERMEDIATE_PAPERS },
  final: { level: "final", label: "Final", hasGroups: true, papers: FINAL_PAPERS },
};

/** Every paper across all three levels. */
export const ALL_PAPERS: PaperSeed[] = [
  ...FOUNDATION_PAPERS,
  ...INTERMEDIATE_PAPERS,
  ...FINAL_PAPERS,
];

/**
 * Resolve a paper by id without knowing its level — for turning a stored `paperId` on a
 * session, mock or block back into a name/colour. Deliberately level-agnostic: these
 * lookups previously searched Foundation only, so an Intermediate or Final student saw
 * raw ids (or the wrong paper) wherever their own history was rendered.
 */
export function paperById(paperId: string): PaperSeed | undefined {
  return ALL_PAPERS.find((p) => p.id === paperId);
}

export type GroupScope = "none" | "I" | "II" | "both";

/** Papers for a level, narrowed to the chosen group. Foundation ignores [group] —
 *  its 4 papers are cleared as a single unit, with no group structure at all. */
export function papersForAttempt(level: IcaiLevel, group: GroupScope = "none"): PaperSeed[] {
  const papers = LEVELS[level].papers;
  if (!LEVELS[level].hasGroups || group === "none" || group === "both") return papers;
  const wanted = group === "I" ? 1 : 2;
  return papers.filter((p) => groupOf(p.paperNo) === wanted);
}

/** True when this level's chapter data has been seeded — screens should degrade
 *  honestly rather than showing an empty syllabus as if it were complete. */
export function hasSyllabusData(level: IcaiLevel): boolean {
  return LEVELS[level].papers.some((p) => p.chapters.length > 0);
}
