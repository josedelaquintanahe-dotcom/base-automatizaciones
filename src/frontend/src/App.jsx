import { NavLink, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import Automatizaciones from "./pages/Automatizaciones";
import Facturacion from "./pages/Facturacion";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/clientes", label: "Clientes" },
  { to: "/cliente-detalle", label: "Detalle cliente" },
  { to: "/automatizaciones", label: "Automatizaciones" },
  { to: "/facturacion", label: "Facturacion" },
  { to: "/settings", label: "Settings" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <Navbar items={navItems} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-8 rounded-3xl bg-[linear-gradient(135deg,#18314f_0%,#0f9d8f_100%)] p-6 text-white shadow-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Admin Console</p>
                <h1 className="mt-2 text-3xl font-semibold">Sistema de automatizaciones</h1>
                <p className="mt-3 max-w-2xl text-sm text-white/80">
                  Panel administrativo conectado solo a endpoints backend ya existentes. Las
                  integraciones pendientes se muestran de forma explicita para evitar falsos
                  positivos funcionales.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-full border px-4 py-2 transition ${
                        isActive
                          ? "border-white/60 bg-white/15 text-white"
                          : "border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/cliente-detalle" element={<ClienteDetalle />} />
            <Route path="/automatizaciones" element={<Automatizaciones />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
