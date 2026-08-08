import type { ChapterSeed, PaperSeed } from "@/lib/icai/foundation";

/**
 * CA Intermediate syllabus seed — ICAI New Scheme (2023), 6 papers across two groups.
 *
 * Built the same way as the Final seed (see icai/final.ts for the full rationale): the
 * tracking unit is ICAI's **published syllabus section**, and `weightage` is the
 * **midpoint of ICAI's published range** for that section, normalised so each paper
 * totals 100. ICAI publishes weightage per section and nothing per chapter, so a
 * section-level number is sourced where a per-chapter one would have to be invented.
 *
 * Split papers are scaled to their real mark split first, so a section's number is its
 * share of the whole paper and stays comparable across papers:
 *   • Paper 2 — 70 company law & LLP + 30 other laws
 *   • Paper 3 — 50 income-tax law + 50 GST
 *   • Paper 6 — 50 financial management + 50 strategic management
 *
 * `estHours` is **not an ICAI figure** — ICAI publishes no study-hour guidance. It is
 * derived proportionally from weightage against a ~140-hour budget per paper, purely as
 * a starting default for the planner to override.
 *
 * ⚠️ ICAI states a deviation of up to ±5% from the published section weightage is to be
 * expected, so these are planning weights and not a promise about any one attempt.
 * Verify section titles against the current syllabus on icai.org before relying on this
 * for real study planning — the same open item PLAN.md §9 flags for the other seeds.
 * Taxation (Paper 3) moves most between attempts, being amendment-driven.
 */

/** Weightage → hours, at roughly 140 hours per 100-mark paper. */
const HOURS_PER_WEIGHTAGE_POINT = 1.4;

function ch(id: string, name: string, weightage: number): ChapterSeed {
  return { id, name, weightage, estHours: Math.round(weightage * HOURS_PER_WEIGHTAGE_POINT) };
}

export const INTERMEDIATE_PAPERS: PaperSeed[] = [
  {
    id: "int-p1",
    paperNo: 1,
    name: "Advanced Accounting",
    category: "accounts",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("int-p1-c1", "Accounting Standards (AS 1–29) & the conceptual framework", 60),
      ch("int-p1-c2", "Company accounts — Schedule III financial statements, buy-back & amalgamation", 32),
      ch("int-p1-c3", "Accounting for branches, including foreign branches", 8),
    ],
  },
  {
    id: "int-p2",
    paperNo: 2,
    name: "Corporate and Other Laws",
    category: "law",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      // Part I — Company Law & LLP (70 marks)
      ch("int-p2-c1", "Incorporation, prospectus, share capital & debentures", 18),
      ch("int-p2-c2", "Deposits, registration of charges, management & administration", 17),
      ch("int-p2-c3", "Dividends, accounts, audit & auditors, foreign companies", 23),
      ch("int-p2-c4", "The Limited Liability Partnership Act, 2008", 12),
      // Part II — Other Laws (30 marks)
      ch("int-p2-c5", "The General Clauses Act, 1897", 11),
      ch("int-p2-c6", "Interpretation of statutes, deeds & documents", 8),
      ch("int-p2-c7", "The Foreign Exchange Management Act, 1999", 11),
    ],
  },
  {
    id: "int-p3",
    paperNo: 3,
    name: "Taxation",
    category: "tax",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      // Section A — Income-tax law (50 marks)
      ch("int-p3-c1", "Basic concepts, basis of charge & procedure for computation", 7),
      ch("int-p3-c2", "Residential status, scope of total income & the five heads of income", 14),
      ch("int-p3-c3", "Clubbing, set-off & carry forward of losses, and deductions from gross total income", 9),
      ch("int-p3-c4", "Advance tax, TDS & TCS", 9),
      ch("int-p3-c5", "Return filing, self-assessment, alternative tax regimes & computing tax liability", 11),
      // Section B — Goods and Services Tax (50 marks)
      ch("int-p3-c6", "GST — introduction & constitutional framework", 1),
      ch("int-p3-c7", "Levy & collection, supply, reverse charge, exemptions & composition levy", 33),
      ch("int-p3-c8", "Place, time & value of supply, input tax credit, registration, invoicing, payment & returns", 16),
    ],
  },
  {
    id: "int-p4",
    paperNo: 4,
    name: "Cost and Management Accounting",
    category: "costing",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("int-p4-c1", "Overview of cost & management accounting — cost concepts and behaviour", 13),
      ch("int-p4-c2", "Ascertainment of cost — material, employee, direct expenses, overheads & activity-based costing", 37),
      ch("int-p4-c3", "Methods of costing — unit, job, batch, process & service costing", 22),
      ch("int-p4-c4", "Cost control & analysis — standard costing, marginal costing, budgets & budgetary control", 28),
    ],
  },
  {
    id: "int-p5",
    paperNo: 5,
    name: "Auditing and Ethics",
    category: "audit",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("int-p5-c1", "Nature, objective & scope of audit", 5),
      ch("int-p5-c2", "Audit strategy, planning & audit programme", 10),
      ch("int-p5-c3", "Risk assessment, internal control, materiality & auditing in a digital environment", 10),
      ch("int-p5-c4", "Audit evidence, assertions, tests of control, sampling & documentation", 15),
      ch("int-p5-c5", "Audit of items of financial statements — revenue, expenses, assets & liabilities", 16),
      ch("int-p5-c6", "Completion, subsequent events, going concern & written representations", 10),
      ch("int-p5-c7", "Audit report, modified opinions & comparative information", 10),
      ch("int-p5-c8", "Audit of banks, government, NPOs, LLPs & co-operative societies", 15),
      ch("int-p5-c9", "Professional ethics, independence, engagement terms & quality control", 9),
    ],
  },
  {
    id: "int-p6",
    paperNo: 6,
    name: "Financial Management & Strategic Management",
    category: "fmsm",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      // Section A — Financial Management (50 marks)
      ch("int-p6-c1", "Scope & objectives of financial management, and financial analysis through ratios", 6),
      ch("int-p6-c2", "Sources of finance, cost of capital, capital structure & leverage", 24),
      ch("int-p6-c3", "Capital investment decisions (NPV, IRR, payback) & dividend decisions", 11),
      ch("int-p6-c4", "Working capital management — receivables, payables, cash & treasury", 9),
      // Section B — Strategic Management (50 marks)
      ch("int-p6-c5", "Introduction to strategic management — vision, mission & levels of strategy", 10),
      ch("int-p6-c6", "External environment analysis — PESTLE, industry analysis & Porter's five forces", 10),
      ch("int-p6-c7", "Internal environment — stakeholders, competitive advantage & SWOT", 10),
      ch("int-p6-c8", "Strategic choices — growth strategies, Ansoff, BCG & GE matrices", 10),
      ch("int-p6-c9", "Strategy implementation — structure, culture, leadership, digital transformation & performance measures", 10),
    ],
  },
];
