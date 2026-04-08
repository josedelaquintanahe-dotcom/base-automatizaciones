export default function LoadingSpinner({ label = "Cargando..." }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
      <span>{label}</span>
    </div>
  );
}
