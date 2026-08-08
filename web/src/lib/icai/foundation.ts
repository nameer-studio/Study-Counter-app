import type { PaperCategory } from "@/lib/domain/types";

/**
 * CA Foundation syllabus seed — New Scheme, 4 papers, no groups (PLAN.md §2.2).
 *
 * ⚠️ Chapter titles below are a best-effort reconstruction of the ICAI New Scheme
 * study material, NOT verified against the current official syllabus. This is the
 * exact open item flagged in PLAN.md §9 ("syllabus seeding accuracy") — treat every
 * chapter name here as a placeholder to be checked against icai.org before this data
 * is trusted for real study planning. Structurally correct (paper → chapter, with
 * weightage and estimated hours), content needs a human pass.
 *
 * Foundation has no natural fit in the fixed six-colour paper-category system (that
 * palette was built around Inter/Final's Accounts/Law/Tax/Costing/Audit/FM-SM
 * structure). Quantitative Aptitude and Business Economics are mapped to the closest
 * available buckets (costing, fmsm) as a pragmatic colour reuse, not a claim of
 * subject equivalence.
 */

export interface ChapterSeed {
  id: string;
  name: string;
  /** ICAI weightage, as a percentage of the paper. */
  weightage: number;
  estHours: number;
}

export interface PaperSeed {
  id: string;
  paperNo: number;
  name: string;
  category: PaperCategory;
  isObjective: boolean;
  hasNegativeMarking: boolean;
  maxMarks: number;
  /** Objective papers only: marks per correct answer and the penalty per wrong one.
   *  Foundation P3/P4 are 100 one-mark MCQs with a 0.25 deduction per wrong answer. */
  markPerCorrect?: number;
  negativeMarkPerWrong?: number;
  chapters: ChapterSeed[];
}

export const FOUNDATION_PAPERS: PaperSeed[] = [
  {
    id: "fnd-p1",
    paperNo: 1,
    name: "Accounting",
    category: "accounts",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      { id: "fnd-p1-c1", name: "Theoretical Framework", weightage: 6, estHours: 8 },
      { id: "fnd-p1-c2", name: "Accounting Process", weightage: 16, estHours: 20 },
      { id: "fnd-p1-c3", name: "Bank Reconciliation Statement", weightage: 6, estHours: 8 },
      { id: "fnd-p1-c4", name: "Inventories", weightage: 8, estHours: 10 },
      { id: "fnd-p1-c5", name: "Depreciation and Amortisation", weightage: 8, estHours: 10 },
      { id: "fnd-p1-c6", name: "Bills of Exchange and Promissory Notes", weightage: 6, estHours: 8 },
      { id: "fnd-p1-c7", name: "Preparation of Final Accounts of Sole Proprietors", weightage: 12, estHours: 16 },
      { id: "fnd-p1-c8", name: "Partnership Accounts", weightage: 14, estHours: 18 },
      { id: "fnd-p1-c9", name: "Financial Statements of Not-for-Profit Organisations", weightage: 8, estHours: 10 },
      { id: "fnd-p1-c10", name: "Introduction to Company Accounts", weightage: 10, estHours: 14 },
      { id: "fnd-p1-c11", name: "Accounting for Share Capital", weightage: 6, estHours: 8 },
    ],
  },
  {
    id: "fnd-p2",
    paperNo: 2,
    name: "Business Laws",
    category: "law",
    isObjective: false,
    hasNegativeMarking: false,
    maxMarks: 100,
    chapters: [
      { id: "fnd-p2-c1", name: "Indian Regulatory Framework", weightage: 8, estHours: 6 },
      { id: "fnd-p2-c2", name: "The Indian Contract Act, 1872", weightage: 24, estHours: 18 },
      { id: "fnd-p2-c3", name: "The Sale of Goods Act, 1930", weightage: 14, estHours: 10 },
      { id: "fnd-p2-c4", name: "The Indian Partnership Act, 1932", weightage: 14, estHours: 10 },
      { id: "fnd-p2-c5", name: "The Limited Liability Partnership Act, 2008", weightage: 10, estHours: 8 },
      { id: "fnd-p2-c6", name: "The Companies Act, 2013", weightage: 20, estHours: 16 },
      { id: "fnd-p2-c7", name: "The Negotiable Instruments Act, 1881", weightage: 10, estHours: 8 },
    ],
  },
  {
    id: "fnd-p3",
    paperNo: 3,
    name: "Quantitative Aptitude",
    category: "costing",
    isObjective: true,
    hasNegativeMarking: true,
    maxMarks: 100,
    markPerCorrect: 1,
    negativeMarkPerWrong: 0.25,
    chapters: [
      { id: "fnd-p3-c1", name: "Ratio, Proportion, Indices and Logarithms", weightage: 6, estHours: 6 },
      { id: "fnd-p3-c2", name: "Equations and Matrices", weightage: 8, estHours: 8 },
      { id: "fnd-p3-c3", name: "Linear Inequalities", weightage: 5, estHours: 5 },
      { id: "fnd-p3-c4", name: "Time Value of Money", weightage: 10, estHours: 10 },
      { id: "fnd-p3-c5", name: "Permutations and Combinations", weightage: 6, estHours: 6 },
      { id: "fnd-p3-c6", name: "Sequence and Series", weightage: 5, estHours: 5 },
      { id: "fnd-p3-c7", name: "Sets, Relations and Functions", weightage: 5, estHours: 5 },
      { id: "fnd-p3-c8", name: "Basic Applications of Differential and Integral Calculus", weightage: 6, estHours: 7 },
      { id: "fnd-p3-c9", name: "Statistical Description of Data", weightage: 8, estHours: 8 },
      { id: "fnd-p3-c10", name: "Measures of Central Tendency and Dispersion", weightage: 8, estHours: 8 },
      { id: "fnd-p3-c11", name: "Probability", weightage: 10, estHours: 10 },
      { id: "fnd-p3-c12", name: "Theoretical Distributions", weightage: 8, estHours: 8 },
      { id: "fnd-p3-c13", name: "Correlation and Regression", weightage: 6, estHours: 6 },
      { id: "fnd-p3-c14", name: "Index Numbers", weightage: 4, estHours: 4 },
    ],
  },
  {
    id: "fnd-p4",
    paperNo: 4,
    name: "Business Economics",
    category: "fmsm",
    isObjective: true,
    hasNegativeMarking: true,
    maxMarks: 100,
    markPerCorrect: 1,
    negativeMarkPerWrong: 0.25,
    chapters: [
      { id: "fnd-p4-c1", name: "Nature & Scope of Business Economics", weightage: 8, estHours: 6 },
      { id: "fnd-p4-c2", name: "Theory of Demand and Supply", weightage: 20, estHours: 16 },
      { id: "fnd-p4-c3", name: "Theory of Production and Cost", weightage: 18, estHours: 14 },
      { id: "fnd-p4-c4", name: "Price Determination in Different Markets", weightage: 20, estHours: 16 },
      { id: "fnd-p4-c5", name: "Business Cycles", weightage: 8, estHours: 6 },
      { id: "fnd-p4-c6", name: "Money and Banking", weightage: 14, estHours: 12 },
      { id: "fnd-p4-c7", name: "Public Finance", weightage: 8, estHours: 6 },
      { id: "fnd-p4-c8", name: "International Trade", weightage: 4, estHours: 4 },
    ],
  },
];
