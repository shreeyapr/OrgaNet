import {
    ArrowUpRight,
    Clock3,
    MapPin,
    Users,
} from "lucide-react";

type EventCardProps = {
  name: string;
  time: string;
  venue: string;
  attendees: string;
  status: "Confirmed" | "Planning" | "At Risk";
  accent: string;
};

export default function EventCard({
  name,
  time,
  venue,
  attendees,
  status,
  accent,
}: EventCardProps) {
  return (
    <button className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm shadow-slate-200/30 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-10 w-1 rounded-full ${accent}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {name}
              </h3>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock3 size={12} />
                {time}
              </div>
            </div>

            <ArrowUpRight
              size={16}
              className="text-slate-300 transition group-hover:text-slate-600"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              {venue}
            </span>

            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {attendees}
            </span>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                status === "Confirmed"
                  ? "bg-emerald-50 text-emerald-600"
                  : status === "Planning"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}