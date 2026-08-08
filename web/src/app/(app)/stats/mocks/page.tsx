"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { PaperSeed } from "@/lib/icai/foundation";
import { papersForAttempt, paperById } from "@/lib/icai/levels";
import { useLocalState } from "@/lib/hooks/useLocalState";
import type { Attempt } from "@/lib/domain/attempt";
import { useSeedOnce } from "@/lib/hooks/useSeededLocalState";
import { useSyncedArrayState } from "@/lib/hooks/useSyncedArrayState";
import { MOCK_TEST_SYNC } from "@/lib/sync/syncConfigs";
import { generateDemoMocks } from "@/lib/demo/seedMocks";
import {
  PASS_MARKS_PER_PAPER,
  newMockId,
  projectPass,
  type MockSource,
  type MockTest,
} from "@/lib/domain/mockTest";
import {
  exemptionStatus,
  mcqAnalysis,
  mockSeries,
  paperColorFor,
  paperNameFor,
} from "@/lib/domain/mockStats";
import { MockTrendChart } from "@/components/charts/MockTrendChart";
import { McqAccuracyCard } from "@/components/charts/McqAccuracyCard";

const MOCKS_KEY = "sc-mock-tests";
const SOURCES: MockSource[] = ["MTP", "RTP", "PYQ", "TEST_SERIES", "SELF"];
const SOURCE_LABEL: Record<MockSource, string> = {
  MTP: "MTP",
  RTP: "RTP",
  PYQ: "Past paper",
  TEST_SERIES: "Test series",
  SELF: "Self mock",
};

/**
 * E5 Mocks & marks — charts 16–19. Mocks are the only honest input to a pass
 * projection, so this screen owns logging them; E4's aggregate gauge reads the same
 * store.
 */
export default function MocksPage() {
  const [attempt] = useLocalState<Attempt | null>("sc-attempt", null);
  // Foundation-only sample mocks — see the note in the Stats overview page.
  const [mocks, setMocks] = useSeedOnce<MockTest[]>(
    useSyncedArrayState<MockTest>(MOCKS_KEY, [], MOCK_TEST_SYNC),
    generateDemoMocks,
    (m) => m.length === 0 && attempt?.level === "foundation",
  );
  const [adding, setAdding] = useState(false);

  // Mocks are logged against the student's own papers — the picker and the per-paper
  // exemption tracker both previously listed Foundation whatever the level.
  const papers = attempt ? papersForAttempt(attempt.level, attempt.group) : [];

  const series = mockSeries(mocks);
  const mcq = mcqAnalysis(mocks);
  const exemptions = exemptionStatus(mocks, papers);

  // Whatever chart 17 is about to render: the analysed papers if there are any, else the
  // student's own objective papers so the caption still says something true.
  const analysedPapers = mcq.map((a) => paperById(a.paperId)).filter((p): p is PaperSeed => !!p);
  const captionPapers =
    analysedPapers.length > 0 ? analysedPapers : papers.filter((p) => p.isObjective && p.hasNegativeMarking);
  const projection = projectPass(mocks);
  const sorted = [...mocks].sort((a, b) => b.date - a.date);

  function addMock(mock: Omit<MockTest, "id">) {
    setMocks((prev) => [...prev, { ...mock, id: newMockId() }]);
    setAdding(false);
  }

  function removeMock(id: string) {
    setMocks((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title text-text">Mocks &amp; marks</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-primary px-3 py-[6px] text-label font-bold text-primary-on"
          >
            {adding ? "Cancel" : "+ Log a mock"}
          </button>
          <Link
            href="/stats"
            className="rounded-lg border border-border px-3 py-[6px] text-label font-semibold text-dim transition-colors hover:border-primary hover:text-primary"
          >
            ← Overview
          </Link>
        </div>
      </div>

      {adding && <AddMockForm papers={papers} onAdd={addMock} onCancel={() => setAdding(false)} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="16 · Mock marks per paper" className="lg:col-span-2">
          <p className="mb-3 text-[10px] text-dim">Every line must clear 40 to pass the paper</p>
          <MockTrendChart series={series} />
        </ChartCard>

        <ChartCard title="17 · MCQ accuracy &amp; negative marking">
          {/* Describes the papers actually analysed below, falling back to the student's
              own objective papers when there's nothing to analyse yet. Naming a fixed
              set (it was hardcoded to Foundation's P3 & P4) contradicted the cards
              whenever the analysed mocks came from anywhere else. */}
          <p className="mb-3 text-[10px] text-dim">
            {captionPapers.length > 0
              ? `${captionPapers.map((p) => `P${p.paperNo}`).join(" & ")} · −${
                  captionPapers[0].negativeMarkPerWrong ?? 0.25
                } per wrong answer`
              : "None of your papers carry negative marking."}
          </p>
          {mcq.length === 0 ? (
            <p className="text-caption text-dim">
              No objective-paper mocks logged with a question breakdown yet.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {mcq.map((a) => (
                <McqAccuracyCard key={a.paperId} analysis={a} />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="19 · Best marks &amp; pass projection">
          <div className="flex flex-col gap-[7px]">
            {exemptions.map((e) => (
              <div
                key={e.paperId}
                className="flex items-center gap-[10px] rounded-xl border border-border bg-surface2 px-3 py-[10px]"
              >
                <span className="h-2 w-2 flex-none rounded-sm" style={{ background: e.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-caption font-semibold text-text">{e.name}</span>
                {e.bestMarks === null ? (
                  <span className="text-caption text-dim">no mock</span>
                ) : (
                  <>
                    <span
                      className="tnum text-label font-bold"
                      style={{ color: e.clearsMinimum ? "var(--green)" : "var(--red)" }}
                    >
                      {e.bestMarks}
                    </span>
                    <span
                      className="w-[74px] flex-none text-right text-[10px] font-semibold"
                      style={{ color: e.qualifiesOnMocks ? "var(--green)" : e.clearsMinimum ? "var(--dim)" : "var(--red)" }}
                    >
                      {e.qualifiesOnMocks ? "60+ on mocks" : e.clearsMinimum ? "clears 40" : "under 40"}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          <div
            className="mt-3 rounded-[13px] p-[13px]"
            style={{
              background: `color-mix(in srgb, ${projection.clearsOverall ? "var(--green)" : "var(--red)"} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${projection.clearsOverall ? "var(--green)" : "var(--red)"} 30%, transparent)`,
            }}
          >
            <p className="text-caption leading-[1.5] text-text">
              {projection.aggregatePercent === null ? (
                "Log mocks across your papers to project whether you clear."
              ) : projection.clearsOverall ? (
                <>
                  On these mocks you clear both gates — {Math.round(projection.aggregatePercent)}%
                  aggregate and every paper above 40.
                </>
              ) : (
                <>
                  On these mocks you don&rsquo;t clear yet.{" "}
                  {projection.papersUnderMinimum.length > 0 && (
                    <>
                      {projection.papersUnderMinimum.map((p) => paperNameFor(p.paperId)).join(", ")}{" "}
                      {projection.papersUnderMinimum.length === 1 ? "is" : "are"} under the
                      40-mark minimum
                      {projection.aggregateClears
                        ? " — which fails the group even though your aggregate is fine."
                        : `, and the aggregate is ${Math.round(projection.aggregatePercent)}%.`}
                    </>
                  )}
                  {projection.papersUnderMinimum.length === 0 && (
                    <>
                      Every paper clears 40, but the aggregate is{" "}
                      {Math.round(projection.aggregatePercent)}% — under the 50% line.
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </ChartCard>

        <ChartCard title="18 · Mock log" className="lg:col-span-2">
          {sorted.length === 0 ? (
            <p className="text-caption text-dim">Nothing logged yet.</p>
          ) : (
            <div className="flex flex-col gap-[7px]">
              {sorted.map((mock) => {
                const clears = mock.marksObtained >= PASS_MARKS_PER_PAPER;
                return (
                  <div
                    key={mock.id}
                    className="group flex items-center gap-[10px] rounded-xl border border-border bg-surface2 px-3 py-[11px]"
                  >
                    <span
                      className="h-2 w-2 flex-none rounded-sm"
                      style={{ background: paperColorFor(mock.paperId) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-caption font-semibold text-text">
                        {paperNameFor(mock.paperId)}
                      </div>
                      <div className="tnum text-[10px] text-dim">
                        {new Date(mock.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                        {SOURCE_LABEL[mock.source]}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="tnum text-[17px] font-extrabold"
                        style={{ color: clears ? "var(--green)" : "var(--red)" }}
                      >
                        {mock.marksObtained}
                      </div>
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: clears ? "var(--green)" : "var(--red)" }}
                      >
                        {clears ? "clears 40" : "under 40"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMock(mock.id)}
                      aria-label={`Remove ${paperNameFor(mock.paperId)} mock`}
                      className="flex-none text-dim opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function AddMockForm({
  papers,
  onAdd,
  onCancel,
}: {
  papers: PaperSeed[];
  onAdd: (mock: Omit<MockTest, "id">) => void;
  onCancel: () => void;
}) {
  const [paperId, setPaperId] = useState(papers[0]?.id ?? "");
  const [marks, setMarks] = useState(50);
  const [source, setSource] = useState<MockSource>("MTP");
  const [correct, setCorrect] = useState(50);
  const [wrong, setWrong] = useState(20);

  // Unlike planned blocks and timer sessions, a mock is logged against a paper and needs
  // no chapter data — so Intermediate and Final work here even while their chapters are
  // still unseeded.
  const paper = papers.find((p) => p.id === paperId);
  const objective = paper?.isObjective ?? false;

  if (!paper) {
    return (
      <div className="mb-4 rounded-card-lg border border-border bg-surface p-4">
        <p className="text-caption text-dim">Set up your attempt before logging a mock.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({
          paperId,
          date: Date.now(),
          marksObtained: marks,
          maxMarks: paper.maxMarks,
          source,
          correctCount: objective ? correct : undefined,
          wrongCount: objective ? wrong : undefined,
          unattemptedCount: objective ? Math.max(0, 100 - correct - wrong) : undefined,
        });
      }}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-card-lg border border-border bg-surface p-4"
    >
      <label className="flex flex-col gap-1">
        <span className="text-caption text-dim">Paper</span>
        <select
          value={paperId}
          onChange={(e) => setPaperId(e.target.value)}
          className="rounded-lg border border-border bg-surface2 px-3 py-2 text-label text-text"
        >
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              P{p.paperNo} — {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-caption text-dim">Marks</span>
        <input
          type="number"
          min={0}
          max={paper.maxMarks}
          value={marks}
          onChange={(e) => setMarks(Math.min(paper.maxMarks, Math.max(0, Number(e.target.value) || 0)))}
          className="tnum w-24 rounded-lg border border-border bg-surface2 px-3 py-2 text-label text-text"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-caption text-dim">Source</span>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as MockSource)}
          className="rounded-lg border border-border bg-surface2 px-3 py-2 text-label text-text"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </label>

      {objective && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-dim">Correct</span>
            <input
              type="number"
              min={0}
              max={100}
              value={correct}
              onChange={(e) => setCorrect(Math.max(0, Number(e.target.value) || 0))}
              className="tnum w-20 rounded-lg border border-border bg-surface2 px-3 py-2 text-label text-text"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-caption text-dim">Wrong</span>
            <input
              type="number"
              min={0}
              max={100}
              value={wrong}
              onChange={(e) => setWrong(Math.max(0, Number(e.target.value) || 0))}
              className="tnum w-20 rounded-lg border border-border bg-surface2 px-3 py-2 text-label text-text"
            />
          </label>
        </>
      )}

      <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-label font-bold text-primary-on">
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-4 py-2 text-label font-semibold text-dim"
      >
        Cancel
      </button>
    </form>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-card-lg border border-border bg-surface p-4", className)}>
      <div className="mb-3 text-overline uppercase text-dim">{title}</div>
      {children}
    </div>
  );
}
