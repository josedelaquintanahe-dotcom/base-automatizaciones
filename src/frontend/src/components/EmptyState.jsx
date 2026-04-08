export default function EmptyState({ title, description, action }) {
  return (
    <div className="panel border-dashed border-slate-300 bg-white/70 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Pendiente</p>
      <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
