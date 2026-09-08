import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Sparkles,
} from "lucide-react";

export default function AIInsight() {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Sparkles size={16} />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">
              AI Insights
            </div>

            <div className="text-[11px] text-slate-400">
              VenueOps intelligence
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            <div className="mt-0.5 text-amber-500">
              <AlertTriangle size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">
                Scheduling conflict detected
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Two functions appear to overlap in Pavilion 2 tomorrow.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="mt-0.5 text-emerald-500">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">
                Most events are on track
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Current event readiness is looking healthy.
              </p>
            </div>
          </div>
        </div>

        <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800">
          Open AI Assistant
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}