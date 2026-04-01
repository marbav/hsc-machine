import { useState } from "react";
import { X, FileText, Printer, Clock } from "lucide-react";

export default function UpdateBanner({ onDismiss }: { onDismiss: () => void }) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div className={`fixed inset-0 z-[9994] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`} onClick={handleClose}>
      <div
        className={`w-[400px] max-w-[90vw] bg-background rounded-2xl border border-primary/20 shadow-2xl overflow-hidden transition-all duration-300 ${closing ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "save-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold tracking-widest uppercase text-primary">New Feature</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">Mock Exam Generator</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate printable exams from real HSC questions.</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          <Feature
            icon={<Clock className="w-4 h-4 text-purple-500" />}
            title="Choose your exam length"
            desc="30 minutes (~20 marks), 1.5 hours (~50 marks), or a full 3-hour paper (~100 marks)."
          />
          <Feature
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            title="Filter by subject & topic"
            desc="Mix and match subjects or focus on one. The exam picks questions to match the mark target."
          />
          <Feature
            icon={<Printer className="w-4 h-4 text-emerald-500" />}
            title="Print-ready PDF"
            desc="Cover page, numbered questions, writing lines, and sample answers at the back. Hit print or save as PDF."
          />
        </div>

        {/* Dismiss */}
        <div className="px-6 pb-5">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try it out
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
