import { ContentLayout } from "@/components/admin/content-layout";
import {
  CreateTriviaButton,
  BulkImportButton,
  GuideLinkButton,
} from "./_components/buttons";
import { TriviaList } from "./_components/trivia-list";
import { TopicManagement } from "./_components/topic-management";
import { AudienceManagement } from "./_components/audience-management";
import { getTrivias, getTopics, getAudiences } from "./_lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Layers, Users } from "lucide-react";
import { serverGetUser } from "@/lib/auth-actions";

export default async function TriviaPage() {
  const [{ user }, trivias, topics, audiences] = await Promise.all([
    serverGetUser(),
    getTrivias(),
    getTopics(),
    getAudiences(),
  ]);

  const maxIndex =
    trivias.length > 0
      ? Math.max(...trivias.map((t) => Number(t.global_index)))
      : 0;

  const nextAvailableIndex = maxIndex + 1;

  // Estadísticas de publicación
  const draftCount = trivias.filter((t) => !t.is_published).length;

  // Solo lead, editor, admin y super_admin pueden gestionar temas y audiencias
  const canManageStructure = Boolean(
    user?.role &&
      ["lead", "editor", "admin", "super_admin"].includes(user.role),
  );

  return (
    <ContentLayout title="Gestión de Trivia & Educación Cívica">
      <div className="space-y-4 sm:space-y-5">
        {/* Tabs de Gestión */}
        <Tabs defaultValue="questions" className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            {canManageStructure ? (
              <TabsList className="grid grid-cols-3 w-full sm:w-auto h-10 p-1">
                <TabsTrigger
                  value="questions"
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <HelpCircle size={14} className="shrink-0" />
                  <span className="truncate">Preguntas</span>
                  <Badge
                    variant="secondary"
                    className="ml-0.5 sm:ml-1 px-1.5 py-0 h-4 text-[10px] font-bold shrink-0"
                  >
                    {trivias.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="topics"
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <Layers size={14} className="shrink-0" />
                  <span className="truncate">Temas</span>
                  <Badge
                    variant="secondary"
                    className="ml-0.5 sm:ml-1 px-1.5 py-0 h-4 text-[10px] font-bold shrink-0"
                  >
                    {topics.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="audiences"
                  className="gap-1.5 text-xs px-2 sm:px-3"
                >
                  <Users size={14} className="shrink-0" />
                  <span className="truncate">Audiencias</span>
                  <Badge
                    variant="secondary"
                    className="ml-0.5 sm:ml-1 px-1.5 py-0 h-4 text-[10px] font-bold shrink-0"
                  >
                    {audiences.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-bold text-foreground border">
                  <HelpCircle size={14} className="text-primary" />
                  <span>Banco de Preguntas</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0 h-4 text-[10px] font-bold"
                  >
                    {trivias.length}
                  </Badge>
                </div>
                {draftCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"
                  >
                    {draftCount} en revisión
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <GuideLinkButton />
              <div className="flex-1 sm:flex-initial">
                <BulkImportButton topics={topics} audiences={audiences} />
              </div>
              <div className="flex-1 sm:flex-initial">
                <CreateTriviaButton
                  nextOrderIndex={nextAvailableIndex}
                  topics={topics}
                  audiences={audiences}
                  canPublishDirectly={canManageStructure}
                />
              </div>
            </div>
          </div>

          <TabsContent value="questions" className="space-y-4 outline-none">
            <TriviaList
              trivias={trivias}
              nextOrderIndex={nextAvailableIndex}
              topics={topics}
              audiences={audiences}
              canPublishDirectly={canManageStructure}
            />
          </TabsContent>

          {canManageStructure && (
            <>
              <TabsContent value="topics" className="outline-none">
                <TopicManagement topics={topics} audiences={audiences} />
              </TabsContent>

              <TabsContent value="audiences" className="outline-none">
                <AudienceManagement audiences={audiences} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </ContentLayout>
  );
}
