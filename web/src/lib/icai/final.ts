import type { ChapterSeed, PaperSeed } from "@/lib/icai/foundation";

/**
 * CA Final syllabus seed — ICAI New Scheme (2023), 6 papers across two groups.
 *
 * ## Where this data comes from, and what it is not
 *
 * The tracking unit here is ICAI's **published syllabus section**, not a study-material
 * chapter. That's deliberate: ICAI publishes weightage at section level and does not
 * publish a per-chapter percentage, so section-level entries carry a real sourced number
 * instead of a per-chapter figure that would have to be invented to look precise.
 *
 * `weightage` is the **midpoint of ICAI's published range** for that section (e.g. a
 * section published as 10%–15% is stored as 12), then normalised so each paper totals
 * 100. For the two split papers the parts are scaled to their real mark split first —
 * Paper 4 is 70 direct tax + 30 international tax, Paper 5 is 75 GST + 25 customs & FTP —
 * so a section's number is its share of the whole paper, comparable across papers.
 *
 * `estHours` is **not an ICAI figure** — ICAI publishes no study-hour guidance. It is
 * derived proportionally from weightage against a ~160-hour budget per paper, purely so
 * the planner has a sane starting estimate. Treat it as a default to be overridden, not
 * a recommendation.
 *
 * ⚠️ Verify section titles against the current syllabus on icai.org before relying on
 * this for real study planning — the same open item PLAN.md §9 already flags for the
 * Foundation seed. Titles here are written to match ICAI's syllabus wording, but the
 * syllabus is revised between attempts and amendment-heavy papers (4 and 5 especially)
 * move most.
 *
 * Paper 6 is the exception to everything above: it is a wholly case-study paper with no
 * chapter structure and no published section weightage. See its note below.
 */

/** Weightage → hours, at roughly 160 hours per 100-mark paper. */
const HOURS_PER_WEIGHTAGE_POINT = 1.6;

function ch(id: string, name: string, weightage: number, hoursPerPoint = HOURS_PER_WEIGHTAGE_POINT): ChapterSeed {
  return { id, name, weightage, estHours: Math.round(weightage * hoursPerPoint) };
}

export const FINAL_PAPERS: PaperSeed[] = [
  {
    id: "fin-p1",
    paperNo: 1,
    name: "Financial Reporting",
    category: "accounts",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("fin-p1-c1", "Framework, presentation of financial statements & measurement bases", 12),
      ch("fin-p1-c2", "Revenue from contracts with customers (Ind AS 115)", 8),
      ch("fin-p1-c3", "Ind AS on assets and liabilities of the financial statements", 20),
      ch("fin-p1-c4", "Items impacting the financial statements, disclosures & other standards", 17),
      ch("fin-p1-c5", "Financial instruments (Ind AS 32, 107, 109)", 13),
      ch("fin-p1-c6", "Group accounting — business combinations & consolidation", 15),
      ch("fin-p1-c7", "First-time adoption & analysis of financial statements", 8),
      ch("fin-p1-c8", "Integrated reporting, CSR reporting, ethics & technology in reporting", 7),
    ],
  },
  {
    id: "fin-p2",
    paperNo: 2,
    name: "Advanced Financial Management",
    category: "fmsm",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("fin-p2-c1", "Financial policy, corporate strategy, risk management & capital budgeting", 11),
      ch("fin-p2-c2", "Security analysis, valuation & portfolio management", 23),
      ch("fin-p2-c3", "Securitisation, mutual funds & derivatives analysis", 23),
      ch("fin-p2-c4", "Foreign exchange exposure, international financial management & interest rate risk", 23),
      ch("fin-p2-c5", "Corporate valuation, mergers, acquisitions & corporate restructuring", 12),
      ch("fin-p2-c6", "Startup finance", 8),
    ],
  },
  {
    id: "fin-p3",
    paperNo: 3,
    name: "Advanced Auditing, Assurance & Professional Ethics",
    category: "audit",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      ch("fin-p3-c1", "Standards on auditing, audit planning, risk assessment & audit reports", 33),
      ch("fin-p3-c2", "Audit of limited companies, corporate governance & consolidated statements", 17),
      ch("fin-p3-c3", "Audit of banks, insurance, NBFCs & entities under fiscal laws", 22),
      ch("fin-p3-c4", "Public sector audit, internal audit, due diligence & investigation", 15),
      ch("fin-p3-c5", "Professional ethics & liabilities of auditors", 13),
    ],
  },
  {
    id: "fin-p4",
    paperNo: 4,
    name: "Direct Tax Laws & International Taxation",
    category: "tax",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      // Part I — Direct tax laws (70 marks)
      ch("fin-p4-c1", "Basis of charge, heads of income, deductions & computation of total income", 28),
      ch("fin-p4-c2", "Taxation of charitable trusts, political parties & electoral trusts", 5),
      ch("fin-p4-c3", "Tax planning, tax avoidance & GAAR", 5),
      ch("fin-p4-c4", "Deduction, collection & recovery of tax", 12),
      ch("fin-p4-c5", "Assessment procedure, appeals, revision & penalties", 15),
      ch("fin-p4-c6", "Liability in special cases & miscellaneous provisions", 5),
      // Part II — International taxation (30 marks)
      ch("fin-p4-c7", "Taxation of non-residents, transfer pricing & equalisation levy", 24),
      ch("fin-p4-c8", "Double taxation relief, tax treaties & BEPS / Model conventions", 6),
    ],
  },
  {
    id: "fin-p5",
    paperNo: 5,
    name: "Indirect Tax Laws",
    category: "law",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      // Part I — GST (75 marks)
      ch("fin-p5-c1", "Levy & collection, supply, place & value of supply, input tax credit", 41),
      ch("fin-p5-c2", "Registration, tax invoice, returns, payment of tax & refunds", 15),
      ch("fin-p5-c3", "Demand & recovery, offences, penalties, appeals & advance ruling", 13),
      ch("fin-p5-c4", "Administration, liability to pay in certain cases & miscellaneous provisions", 6),
      // Part II — Customs & FTP (25 marks)
      ch("fin-p5-c5", "Levy of customs duty, classification, valuation & exemptions", 13),
      ch("fin-p5-c6", "Import & export procedures, warehousing, duty drawback & refunds", 8),
      ch("fin-p5-c7", "Foreign Trade Policy — schemes & constitutional framework", 4),
    ],
  },
  {
    id: "fin-p6",
    paperNo: 6,
    name: "Integrated Business Solutions",
    category: "costing",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    // Paper 6 is a wholly case-study paper: ICAI publishes no chapters and no section
    // weightage for it, because it deliberately draws on the other papers rather than
    // owning its own syllabus. The entries below are therefore the seven domains ICAI
    // names as its coverage, weighted evenly — an even split is an honest "no published
    // weighting" rather than a fabricated one, and Corporate & Economic Laws and
    // Strategic Cost & Performance Management appear here because the New Scheme folded
    // them into this paper instead of keeping them standalone.
    chapters: [
      ch("fin-p6-c1", "Corporate & Economic Laws (integration)", 15, 1.2),
      ch("fin-p6-c2", "Strategic Cost & Performance Management (integration)", 15, 1.2),
      ch("fin-p6-c3", "Financial Reporting (integration)", 14, 1.2),
      ch("fin-p6-c4", "Advanced Financial Management (integration)", 14, 1.2),
      ch("fin-p6-c5", "Advanced Auditing & Professional Ethics (integration)", 14, 1.2),
      ch("fin-p6-c6", "Direct & Indirect Tax Laws (integration)", 14, 1.2),
      ch("fin-p6-c7", "Multidisciplinary case study practice", 14, 1.2),
    ],
  },
];
