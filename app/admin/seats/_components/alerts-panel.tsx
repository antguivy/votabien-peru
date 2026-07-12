"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

type Alert = {
  id: string;
  type: string;
  status: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

export function AlertsPanel({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const markResolved = async (id: string, status: "RESOLVED" | "IGNORED") => {
    // Optimistic UI
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/admin/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("No se pudo actualizar la alerta", error);
      // Opcional: Revertir en caso de error
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 border border-amber-200 bg-amber-50 rounded-lg p-4">
      <h3 className="flex items-center text-amber-800 font-semibold mb-3">
        <AlertCircle className="w-5 h-5 mr-2" />
        Alertas de Sistema ({alerts.length})
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white p-3 rounded shadow-sm border border-amber-100 flex justify-between items-start"
          >
            <div>
              <p className="font-medium text-sm text-slate-800">
                {alert.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
              <span className="inline-block mt-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">
                {new Date(alert.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => markResolved(alert.id, "RESOLVED")}
                className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"
                title="Marcar como resuelto"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => markResolved(alert.id, "IGNORED")}
                className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors"
                title="Ignorar falso positivo"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
