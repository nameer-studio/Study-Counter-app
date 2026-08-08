import type { PaperSeed } from "@/lib/icai/foundation";
import { FOUNDATION_PAPERS } from "@/lib/icai/foundation";
import type { IcaiLevel } from "@/lib/domain/types";

/**
 * Paper definitions for all three ICAI levels (New Scheme).
 *
 * ⚠️ Intermediate and Final carry **no chapter data yet** — only paper identity, group,
 * and marking flags. Foundation was seeded first deliberately (4 papers, the cheapest
 * way to validate the whole pipeline before committing to 12 more), per PLAN.md §8.
 * Screens must handle an empty `chapters` array honestly rather than rendering as if
 * the syllabus were complete.
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

// Final has two tax papers but only six palette colours; Indirect Tax borrows the
// law colour so all six papers stay visually distinct. Colour identity here is for
// telling papers apart on a chart, not a claim about subject grouping.
const FINAL_PAPERS: PaperSeed[] = [
  { id: "fin-p1", paperNo: 1, name: "Financial Reporting", category: "accounts", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "fin-p2", paperNo: 2, name: "Advanced Financial Management", category: "fmsm", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "fin-p3", paperNo: 3, name: "Advanced Auditing, Assurance & Professional Ethics", category: "audit", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "fin-p4", paperNo: 4, name: "Direct Tax Laws & International Taxation", category: "tax", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  { id: "fin-p5", paperNo: 5, name: "Indirect Tax Laws", category: "law", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
  // Paper 6 is a multidisciplinary open-book case study — flagged so the mock-test
  // screen can offer the open-book variant.
  { id: "fin-p6", paperNo: 6, name: "Integrated Business Solutions", category: "costing", isObjective: false, hasNegativeMarking: false, maxMarks: 100, chapters: [] },
];

export const LEVELS: Record<IcaiLevel, LevelPapers> = {
  foundation: { level: "foundation", label: "Foundation", hasGroups: false, papers: FOUNDATION_PAPERS },
  intermediate: { level: "intermediate", label: "Intermediate", hasGroups: true, papers: INTERMEDIATE_PAPERS },
  final: { level: "final", label: "Final", hasGroups: true, papers: FINAL_PAPERS },
};

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
