import { prisma } from "@/lib/prisma";
import { serverRequireAdmin } from "@/lib/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Check, X, ArrowRight } from "lucide-react";
import { applyResearchProposal, rejectResearchProposal } from "./actions";

export default async function PropuestasPage() {
  await serverRequireAdmin();

  const proposals = await prisma.research_proposals.findMany({
    where: { status: "PENDING" },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Inbox de Revisiones
        </h1>
        <p className="text-muted-foreground">
          Revisa y aprueba las propuestas de investigación generadas por la IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No hay propuestas pendientes.
          </p>
        )}

        {proposals.map((p) => {
          const data = p.proposed_data as any;
          const isPenal = data.type === "PENAL";

          return (
            <Card key={p.id} className="flex flex-col relative overflow-hidden">
              {isPenal && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-md font-bold">
                  SENSITIVO: PENAL
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      p.action === "INSERT"
                        ? "default"
                        : p.action === "UPDATE"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {p.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Conf: {(p.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{data.title}</CardTitle>
                <CardDescription className="text-xs">
                  {p.reason}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm space-y-2">
                <div className="bg-muted p-2 rounded-md">
                  <p className="font-semibold">Nuevo Dato:</p>
                  <p className="line-clamp-3">
                    {data.summary || "Sin resumen"}
                  </p>
                </div>
                {p.action === "UPDATE" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Reemplaza a:</span>
                    <Badge variant="outline">
                      {p.target_id?.substring(0, 8)}
                    </Badge>
                  </div>
                )}
                {data.source_url && (
                  <a
                    href={data.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline text-xs flex items-center gap-1"
                  >
                    Ver fuente original <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-end gap-2 pt-4">
                <form
                  action={async () => {
                    "use server";
                    await rejectResearchProposal(p.id);
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    <X className="h-4 w-4 mr-1" /> Ignorar
                  </Button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await applyResearchProposal(p.id);
                  }}
                >
                  <Button
                    variant="default"
                    size="sm"
                    type="submit"
                    className={isPenal ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <Check className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                </form>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
