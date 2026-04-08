export default function StatCard({ title, value, caption, tone = "default" }) {
  const toneClasses = {
    default: "bg-white text-ink",
    success: "bg-emerald-50 text-emerald-900",
    warning: "bg-amber-50 text-amber-900",
    danger: "bg-rose-50 text-rose-900",
  };

  return (
    <div className={`panel ${toneClasses[tone] || toneClasses.default}`}>
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      {caption ? <p className="mt-3 text-sm text-slate-600">{caption}</p> : null}
    </div>
  );
}
