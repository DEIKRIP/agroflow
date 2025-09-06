"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type AdminUser = {
  id: string;
  email: string;
  role?: string;
};

export default function AdminModule() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with a real Supabase query to your users table
        const mock: AdminUser[] = [];
        if (!cancelled) setUsers(mock);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudo cargar usuarios");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-2">
      <Card>
        <CardHeader>
          <CardTitle>Administración</CardTitle>
          <CardDescription>Gestión de usuarios y roles (vista simplificada).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {!loading && !error && users.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay usuarios para mostrar.</p>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between items-center border rounded-md p-3">
                  <div>
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs text-muted-foreground">Rol: {u.role || "N/A"}</div>
                  </div>
                  <Button size="sm" variant="secondary" disabled>Editar</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}