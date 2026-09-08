import {
    AlertTriangle,
    CalendarDays,
    CheckSquare,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
};

const iconMap = {
  CalendarDays,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendPositive = true,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={19} strokeWidth={1.8} />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
              trendPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <TrendingUp size={11} />
            {trend}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </div>

        <div className="mt-1 text-sm font-medium text-slate-700">
          {title}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          {description}
        </div>
      </div>
    </div>
  );
}