import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGame } from "@/lib/gameState";
import { playSelect, playDeselect, playGenerate, playPrint } from "@/lib/sounds";
import {
  Clock, FileText, Loader2, Printer, Download, Check, X, ChevronDown, Sparkles, Zap,
} from "lucide-react";

import type { Question } from "@shared/schema";

const EXAM_OPTIONS = [
  { label: "30 min", minutes: 30, marks: 20, emoji: "⚡" },
  { label: "1.5 hours", minutes: 90, marks: 50, emoji: "📝" },
  { label: "3 hours", minutes: 180, marks: 100, emoji: "📋" },
];

// Particle burst component for button clicks
function ParticleBurst({ trigger, x, y, color }: { trigger: number; x: number; y: number; color: string }) {
  if (!trigger) return null;
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 30 + Math.random() * 20;
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      delay: Math.random() * 0.05,
      size: 3 + Math.random() * 3,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-50" key={trigger}>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: x,
            top: y,
            width: p.size,
            height: p.size,
            background: color,
            animation: `mock-particle 0.5s ease-out ${p.delay}s forwards`,
            ["--tx" as any]: `${p.tx}px`,
            ["--ty" as any]: `${p.ty}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// Pulse ring effect on buttons
function PulseRing({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 rounded-xl pointer-events-none">
      <div
        className="absolute inset-0 rounded-xl border-2 border-primary"
        style={{ animation: "mock-pulse-ring 0.6s ease-out forwards" }}
      />
    </div>
  );
}

export default function MockExamPage() {
  const [selectedTime, setSelectedTime] = useState<typeof EXAM_OPTIONS[0] | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [examData, setExamData] = useState<{ questions: Question[]; totalMarks: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const { trackMockExam } = useGame();

  // Effects state
  const [particles, setParticles] = useState<{ trigger: number; x: number; y: number; color: string }>({ trigger: 0, x: 0, y: 0, color: "" });
  const [pulseIdx, setPulseIdx] = useState<number | null>(null);
  const [genShake, setGenShake] = useState(false);
  const [resultReveal, setResultReveal] = useState(false);
  const [chipBounce, setChipBounce] = useState<string | null>(null);

  const { data: subjects = [] } = useQuery<string[]>({ queryKey: ["/api/subjects"] });

  const subjectsKey = Array.from(selectedSubjects).sort().join(",");
  const { data: availableTopics = [] } = useQuery<string[]>({
    queryKey: ["/api/subjects", subjectsKey, "topics"],
    queryFn: async () => {
      if (!subjectsKey) return [];
      const res = await apiRequest("GET", `/api/subjects/${encodeURIComponent(subjectsKey)}/topics`);
      return res.json();
    },
    enabled: selectedSubjects.size > 0,
  });

  const toggleSubject = (s: string, e: React.MouseEvent) => {
    const wasSelected = selectedSubjects.has(s);
    setSelectedSubjects(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
    setSelectedTopics(new Set());
    setExamData(null);

    // Effects
    if (!wasSelected) {
      playSelect();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setParticles({ trigger: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color: "hsl(var(--primary))" });
    } else {
      playDeselect();
    }
    setChipBounce(s);
    setTimeout(() => setChipBounce(null), 300);
  };

  const toggleTopic = (t: string, e: React.MouseEvent) => {
    const wasSelected = selectedTopics.has(t);
    setSelectedTopics(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
    setExamData(null);

    if (!wasSelected) {
      playSelect();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setParticles({ trigger: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color: "hsl(var(--primary))" });
    } else {
      playDeselect();
    }
    setChipBounce(t);
    setTimeout(() => setChipBounce(null), 300);
  };

  const handleTimeSelect = (opt: typeof EXAM_OPTIONS[0], idx: number, e: React.MouseEvent) => {
    setSelectedTime(opt);
    setExamData(null);
    playSelect();
    setPulseIdx(idx);
    setTimeout(() => setPulseIdx(null), 600);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setParticles({
      trigger: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color: "hsl(var(--primary))",
    });
  };

  const handleGenerate = async () => {
    if (!selectedTime) return;
    setGenerating(true);
    setExamData(null);
    setResultReveal(false);
    playGenerate();

    // Shake effect on the generate button area
    setGenShake(true);
    setTimeout(() => setGenShake(false), 500);

    try {
      const res = await apiRequest("POST", "/api/mock-exam", {
        targetMarks: selectedTime.marks,
        subjects: Array.from(selectedSubjects),
        topics: Array.from(selectedTopics),
      });
      const data = await res.json();
      setExamData(data);
      trackMockExam();

      // Reveal animation for results
      setTimeout(() => setResultReveal(true), 100);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handlePrint = () => {
    if (!examData || !selectedTime) return;
    playPrint();

    // Build base URL for images in the print window
    // Use the current page URL (minus hash) as base so relative paths resolve correctly
    const pageUrl = window.location.href.split('#')[0].replace(/\/$/, '');
    const baseUrl = pageUrl;

    const subjectList = selectedSubjects.size > 0
      ? Array.from(selectedSubjects).join(", ")
      : "All Subjects";

    const year = new Date().getFullYear();

    const mcQuestions = examData.questions.filter(q => q.marks === 1 && q.questionText.includes("A."));
    const extQuestions = examData.questions.filter(q => !mcQuestions.includes(q));
    const mcMarks = mcQuestions.length;
    const extMarks = examData.totalMarks - mcMarks;

    const writingLines = (marks: number) => {
      const lineCount = Math.max(3, Math.min(marks * 3, 20));
      return Array(lineCount).fill(0).map(() =>
        `<div style="border-bottom: 1px dotted #bbb; height: 22px; width: 100%;"></div>`
      ).join("");
    };

    const pageHeader = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 20px; font-size: 10px;">
        <b>Build. Understand. Venture.</b>
        <span>${subjectList} Practice Paper</span>
      </div>`;

    const pageFooter = (pageNum: number) => `
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 6px; margin-top: 30px; font-size: 9px; color: #555;">
        <span>– ${pageNum} –</span>
        <span><i>© HSC Machine ${year}</i></span>
      </div>`;

    const formatText = (text: string) => text.split("\n").map(line => {
      if (!line.trim()) return "<br/>";
      if (line.includes("|")) return `<p style="font-family: 'Courier New', monospace; font-size: 10px; margin: 1px 0; white-space: pre;">${line}</p>`;
      return `<p style="margin: 5px 0; line-height: 1.65;">${line}</p>`;
    }).join("");

    type QGroup = { questions: typeof examData.questions; baseLabel: string };
    const qGroups: QGroup[] = [];
    let currentGroup: QGroup | null = null;

    for (const q of examData.questions) {
      const qn = q.questionNumber;
      const base = qn.replace(/[a-e](\(.*\))?$/i, "").replace(/\([a-e]\)$/i, "");
      const groupKey = `${q.subject}|||${q.year}|||${base}`;

      if (currentGroup && currentGroup.baseLabel === groupKey) {
        currentGroup.questions.push(q);
      } else {
        currentGroup = { questions: [q], baseLabel: groupKey };
        qGroups.push(currentGroup);
      }
    }

    let questionNum = 1;
    const questionsHtml = qGroups.map((group) => {
      const num = questionNum++;
      const first = group.questions[0];
      const groupMarks = group.questions.reduce((s, q) => s + q.marks, 0);
      const isMC = first.marks === 1 && first.questionText.includes("A.") && group.questions.length === 1;

      if (group.questions.length === 1) {
        return `
          <div style="margin-bottom: 24px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
              <div>
                <b>Question ${num}</b>
                <span style="font-size: 10px; color: #666; margin-left: 8px; font-style: italic;">(${first.year} HSC ${first.questionNumber})</span>
              </div>
              <b style="font-size: 12px;">(${first.marks} mark${first.marks > 1 ? "s" : ""})</b>
            </div>
            <div style="font-size: 12px;">${formatText(first.questionText)}</div>
            ${(first as any).diagramImageUrl ? `<div style="margin-top: 10px; text-align: center;"><img src="${baseUrl}${(first as any).diagramImageUrl}" style="max-width: 480px; max-height: 350px; border: 1px solid #ddd; border-radius: 4px; padding: 4px;" /><br/><span style="font-size: 9px; color: #888; font-style: italic;">${first.diagramCaption || ''}</span></div>` : first.diagramCaption ? `<div style="margin-top: 8px; padding: 8px 12px; border: 1px solid #999; border-radius: 4px; font-size: 10px;"><b style="color: #333;">📎 This question includes a diagram — refer to the original ${first.year} HSC ${first.subject} paper (${first.questionNumber})</b><br/><span style="color: #666; font-style: italic;">${first.diagramCaption}</span></div>` : ""}
            ${!isMC && first.marks >= 20 ? `<div style="margin-top: 12px; padding: 10px 14px; border: 1px solid #000; font-size: 11px;"><b>Write your answer in a separate writing booklet.</b></div>` : !isMC ? `<div style="margin-top: 12px;">${writingLines(first.marks)}</div>` : ""}
          </div>`;
      }

      const partLabels = "abcdefghij";
      const partsHtml = group.questions.map((q, i) => {
        const partLetter = partLabels[i] || String(i + 1);
        return `
          <div style="margin-top: 14px; margin-left: 16px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <b style="font-size: 12px;">(${partLetter})</b>
              <span style="font-size: 11px;">${q.marks} mark${q.marks > 1 ? "s" : ""}</span>
            </div>
            <div style="font-size: 12px;">${formatText(q.questionText)}</div>
            ${(q as any).diagramImageUrl ? `<div style="margin-top: 8px; text-align: center;"><img src="${baseUrl}${(q as any).diagramImageUrl}" style="max-width: 440px; max-height: 300px; border: 1px solid #ddd; border-radius: 4px; padding: 4px;" /><br/><span style="font-size: 9px; color: #888; font-style: italic;">${q.diagramCaption || ''}</span></div>` : q.diagramCaption ? `<div style="margin-top: 6px; padding: 6px 10px; border: 1px solid #999; border-radius: 4px; font-size: 10px;"><b style="color: #333;">📎 Diagram — refer to the original ${q.year} HSC paper (${q.questionNumber})</b><br/><span style="color: #666; font-style: italic;">${q.diagramCaption}</span></div>` : ""}
            ${q.marks >= 20 ? `<div style="margin-top: 8px; padding: 8px 12px; border: 1px solid #000; font-size: 11px;"><b>Write your answer in a separate writing booklet.</b></div>` : `<div style="margin-top: 8px;">${writingLines(q.marks)}</div>`}
          </div>`;
      }).join("");

      return `
        <div style="margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <div>
              <b>Question ${num}</b>
              <span style="font-size: 10px; color: #666; margin-left: 8px; font-style: italic;">(${first.year} HSC ${first.questionNumber.replace(/[a-e]$/i, "")})</span>
            </div>
            <b style="font-size: 12px;">(${groupMarks} marks)</b>
          </div>
          ${partsHtml}
        </div>`;
    }).join("");

    questionNum = 1;
    const solutionsHtml = examData.questions.map((q) => {
      const num = questionNum++;
      if (!q.sampleAnswer) return `
        <div style="margin-bottom: 12px;">
          <b style="font-size: 11px;">Q${num}.</b>
          <span style="font-size: 11px; color: #999; margin-left: 6px; font-style: italic;">No sample answer available</span>
        </div>
      `;
      const answerHtml = q.sampleAnswer.split("\n").map(line =>
        line.trim() ? `<p style="margin: 2px 0; font-size: 11px; line-height: 1.5;">${line}</p>` : ""
      ).join("");

      return `
        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px;">
            <b style="font-size: 11px;">Q${num}.</b>
            <span style="font-size: 9px; color: #888;">(${q.marks} marks)</span>
          </div>
          <div style="padding-left: 0; color: #333;">
            ${answerHtml}
          </div>
        </div>
      `;
    }).join("");

    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>HSC Mock Exam — ${subjectList}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 12px; line-height: 1.5; }
    @page { margin: 18mm 20mm; }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

  <!-- Print button -->
  <div class="no-print" style="position: fixed; top: 16px; right: 16px; z-index: 100;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #6d28d9; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: system-ui;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <!-- COVER PAGE -->
  <div style="min-height: 95vh; padding: 40px 20px;">
    ${pageHeader}

    <div style="text-align: right; margin-top: 20px; font-size: 12px;">
      Student Number: ……………………. ..
    </div>

    <div style="display: flex; align-items: center; gap: 40px; margin-top: 50px;">
      <div style="text-align: center;">
        <div style="width: 100px; height: 100px; background: #6d28d9; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          <span style="font-size: 48px; color: white; font-weight: 900; font-family: system-ui;">H</span>
        </div>
        <div style="font-size: 24px; font-weight: 900; font-family: system-ui; letter-spacing: -0.5px;">HSC</div>
        <div style="font-size: 11px; font-weight: 600; font-family: system-ui; letter-spacing: 0.1em; color: #555;">MACHINE</div>
      </div>

      <div>
        <h1 style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">PRACTICE PAPER</h1>
        <p style="font-size: 18px; margin-top: 16px;">Total marks: ${examData.totalMarks}</p>
        <p style="font-size: 18px;">Working time: ${selectedTime.label}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 60px; font-size: 12px;">
      <tr>
        <td style="border: 1px solid #000; padding: 12px; width: 40%; vertical-align: top;">
          <b>Total marks: ${examData.totalMarks}</b><br/>
          <b>Working time:</b> ${selectedTime.label}
        </td>
        <td style="border: 1px solid #000; padding: 12px; vertical-align: top;">
          <b>General Instructions</b><br/>
          • Reading time – 5 minutes<br/>
          • Write in black pen<br/>
          • Draw diagrams using pencil<br/>
          • Board-approved calculators permitted
        </td>
      </tr>
    </table>

    <table style="width: 70%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
      <tr style="background: #000; color: #fff;">
        <td style="padding: 8px 12px; font-weight: bold;">Section</td>
        <td style="padding: 8px 12px; font-weight: bold; text-align: center;">Marks</td>
      </tr>
      ${mcMarks > 0 ? `<tr><td style="border: 1px solid #000; padding: 8px 12px;">Section I – Multiple Choice</td><td style="border: 1px solid #000; padding: 8px 12px; text-align: center;">${mcMarks}</td></tr>` : ""}
      ${extMarks > 0 ? `<tr><td style="border: 1px solid #000; padding: 8px 12px;">Section II – Short Answer & Extended Response</td><td style="border: 1px solid #000; padding: 8px 12px; text-align: center;">${extMarks}</td></tr>` : ""}
    </table>

    ${pageFooter(1)}
  </div>

  <!-- QUESTIONS -->
  <div class="page-break"></div>
  <div>
    ${pageHeader}

    ${mcMarks > 0 ? `
      <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px;">SECTION I – MULTIPLE CHOICE</h2>
      <p style="font-size: 11px; margin-bottom: 4px;"><b>${mcMarks} marks</b></p>
      <p style="font-size: 11px; margin-bottom: 4px;">Attempt Questions 1–${mcMarks}</p>
      <p style="font-size: 11px; font-style: italic; margin-bottom: 16px;">Allow about ${Math.round(selectedTime.minutes * mcMarks / examData.totalMarks)} minutes for this section</p>
      <p style="font-size: 11px; margin-bottom: 20px;">Use the multiple-choice answer sheet for Questions 1–${mcMarks}.</p>
      <hr style="border: 0; border-top: 1px solid #000; margin-bottom: 20px;"/>
    ` : ""}

    ${questionsHtml}

    ${pageFooter(2)}
  </div>

  <!-- SOLUTIONS -->
  <div class="page-break"></div>
  <div>
    ${pageHeader}
    <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 16px;">SAMPLE ANSWERS / MARKING CRITERIA</h2>
    <p style="font-size: 10px; color: #666; font-style: italic; margin-bottom: 16px;">Some answers may not perfectly match their question — always verify with the original NESA paper.</p>
    ${solutionsHtml}
    ${pageFooter(3)}
  </div>

  <div style="text-align: center; padding: 24px; color: #aaa; font-size: 9px; font-style: italic;">
    Generated by HSC Machine — Created by MB
  </div>

</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <ParticleBurst {...particles} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Mock Exam Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a printable mock exam with questions and solutions.
        </p>
      </div>

      {/* Time selection */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5 space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exam Length</h3>
          <div className="grid grid-cols-3 gap-3">
            {EXAM_OPTIONS.map((opt, idx) => (
              <button
                key={opt.minutes}
                onClick={(e) => handleTimeSelect(opt, idx, e)}
                className={`relative p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  selectedTime?.minutes === opt.minutes
                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                    : "border-border hover:border-foreground/20 hover:shadow-sm"
                }`}
                style={{
                  animation: selectedTime?.minutes === opt.minutes ? "mock-card-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" : undefined,
                }}
              >
                <PulseRing active={pulseIdx === idx} />
                <div className={`text-2xl mb-1 transition-transform duration-200 ${
                  selectedTime?.minutes === opt.minutes ? "scale-110" : ""
                }`}>
                  {opt.emoji}
                </div>
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">~{opt.marks} marks</div>
                {selectedTime?.minutes === opt.minutes && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Subject chips */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subjects <span className="font-normal">(optional — leave empty for all)</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const isSelected = selectedSubjects.has(s);
                const isDisabled = s === "English Advanced";
                return (
                  <div key={s} className="relative group">
                    <button
                      onClick={(e) => !isDisabled && toggleSubject(s, e)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                        isDisabled
                          ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed line-through"
                          : isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                      } ${chipBounce === s ? "mock-chip-bounce" : ""}`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {s}
                    </button>
                    {isDisabled && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-foreground text-background text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Not available — requires writing booklets
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic chips */}
          {selectedSubjects.size > 0 && availableTopics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Topics <span className="font-normal">(optional)</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {availableTopics.map((t) => {
                  const isSelected = selectedTopics.has(t);
                  return (
                    <button
                      key={t}
                      onClick={(e) => toggleTopic(t, e)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                      } ${chipBounce === t ? "mock-chip-bounce" : ""}`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground italic leading-relaxed">
            Some questions reference diagrams from the original NESA papers. The mock exam PDF will note which questions need diagrams — have the original paper handy for reference.
          </p>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedTime || generating}
            className={`w-full gap-2 transition-all duration-300 ${genShake ? "mock-gen-shake" : ""} ${
              generating ? "" : "hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
            }`}
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Building your exam...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Mock Exam
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {examData && selectedTime && (
        <Card className={`border border-border shadow-sm overflow-hidden transition-all duration-500 ${
          resultReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Exam Ready
              </h3>
              <Button
                onClick={handlePrint}
                className="gap-2 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                size="sm"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: examData.totalMarks, label: "Total Marks", delay: "0s" },
                { value: examData.questions.length, label: "Questions", delay: "0.1s" },
                { value: selectedTime.label, label: "Time", delay: "0.2s" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-lg bg-muted/50"
                  style={{
                    animation: resultReveal ? `mock-stat-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${stat.delay} both` : undefined,
                  }}
                >
                  <div className="text-lg font-bold text-primary">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Question list preview */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {examData.questions.map((q, i) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/30"
                  style={{
                    animation: resultReveal ? `mock-row-slide 0.3s ease-out ${0.05 * Math.min(i, 10)}s both` : undefined,
                  }}
                >
                  <span className="font-medium">Q{i + 1}</span>
                  <span className="text-muted-foreground truncate mx-2 flex-1">{q.questionText.slice(0, 60)}...</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{q.marks}m</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
