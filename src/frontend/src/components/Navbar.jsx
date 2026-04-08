import { NavLink } from "react-router-dom";

export default function Navbar({ items }) {
  return (
    <aside className="border-b border-slate-200/80 px-4 py-4 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
      <div className="sticky top-0">
        <div className="rounded-3xl bg-sand p-5 shadow-panel">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Base SaaS</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">Admin Frontend</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Capa visual independiente para administrar onboarding, estado del sistema y consulta
            segura de clientes.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-2xl border px-4 py-3 text-sm transition ${
                  isActive
                    ? "border-accent/30 bg-accent/10 text-ink"
                    : "border-slate-200/70 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
