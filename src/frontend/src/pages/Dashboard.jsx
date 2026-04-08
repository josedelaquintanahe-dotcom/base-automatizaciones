import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import StatCard from "../components/StatCard";
import { getHealth, getSystemStatus } from "../utils/api";

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const [healthData, systemData] = await Promise.all([getHealth(), getSystemStatus()]);

        if (!isMounted) {
          return;
        }

        setHealth(healthData);
        setSystemStatus(systemData);
        setError("");
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner label="Consultando estado del backend y Supabase..." />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="panel border-rose-200 bg-rose-50 text-rose-900">
          <h2 className="panel-title">No se pudo cargar el dashboard</h2>
          <p className="panel-subtitle">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Backend"
          value={health?.status === "ok" ? "OK" : "KO"}
          caption={`Servicio: ${health?.service || "backend"}`}
          tone={health?.status === "ok" ? "success" : "danger"}
        />
        <StatCard
          title="Supabase"
          value={systemStatus?.connectivity || "desconocido"}
          caption={`Estado: ${systemStatus?.status || "sin datos"}`}
          tone={systemStatus?.connectivity === "reachable" ? "success" : "warning"}
        />
        <StatCard
          title="Entorno"
          value={systemStatus?.environment || health?.environment || "development"}
          caption="Valor reportado por la API"
        />
        <StatCard
          title="Ultimo timestamp"
          value={systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleTimeString() : "-"}
          caption={systemStatus?.timestamp || health?.timestamp || "sin timestamp"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel">
          <h2 className="panel-title">Salud del sistema</h2>
          <p className="panel-subtitle">
            Vista rápida del backend Express y de la comprobación técnica actual contra Supabase.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Health endpoint</p>
              <pre className="mt-3 overflow-auto text-xs text-slate-700">
                {JSON.stringify(health, null, 2)}
              </pre>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">System status endpoint</p>
              <pre className="mt-3 overflow-auto text-xs text-slate-700">
                {JSON.stringify(systemStatus, null, 2)}
              </pre>
            </div>
          </div>
        </section>

        <section className="panel bg-[linear-gradient(180deg,rgba(24,49,79,1),rgba(17,36,58,1))] text-white">
          <h2 className="text-xl font-semibold">Lectura operativa</h2>
          <div className="mt-5 space-y-4 text-sm text-white/80">
            <p>
              El dashboard solo usa endpoints ya presentes en el backend. No se muestran KPIs de
              clientes, automatizaciones o facturación que todavía no estén respaldados por
              contratos API estables.
            </p>
            <p>
              Si <code>connectivity</code> está en <code>reachable</code>, la base de Supabase
              responde correctamente en la comprobación técnica actual.
            </p>
            <p>
              Si alguna integración todavía no está cerrada, se refleja como placeholder en las
              pantallas siguientes en lugar de simular datos falsos.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
