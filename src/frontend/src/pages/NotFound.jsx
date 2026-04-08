import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="panel text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">404</p>
      <h2 className="mt-4 text-3xl font-semibold text-ink">Ruta no encontrada</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
        La pantalla solicitada no existe en este frontend admin. Vuelve al dashboard principal para
        continuar.
      </p>
      <Link className="button-primary mt-6" to="/">
        Volver al dashboard
      </Link>
    </div>
  );
}
