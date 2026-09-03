import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTriviaButton, BulkImportButton } from "./_components/buttons";
import { TriviaList } from "./_components/trivia-list";
import { TopicManagement } from "./_components/topic-management";
import { AudienceManagement } from "./_components/audience-management";
import { getTrivias, getTopics, getAudiences } from "./_lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Layers, Users } from "lucide-react";

export default async function TriviaPage() {
  const [trivias, topics, audiences] = await Promise.all([
    getTrivias(),
    getTopics(),
    getAudiences(),
  ]);

  const maxIndex =
    trivias.length > 0
      ? Math.max(...trivias.map((t) => Number(t.global_index)))
      : 0;

  const nextAvailableIndex = maxIndex + 1;

  return (
    <ContentLayout title="Gestión de Trivia & Educación Cívica">
      <div className="space-y-4 sm:space-y-5">
        {/* Tabs de Gestión */}
        <Tabs defaultValue="questions" className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
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

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <BulkImportButton topics={topics} audiences={audiences} />
              </div>
              <div className="flex-1 sm:flex-initial">
                <CreateTriviaButton
                  nextOrderIndex={nextAvailableIndex}
                  topics={topics}
                  audiences={audiences}
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
            />
          </TabsContent>

          <TabsContent value="topics" className="outline-none">
            <TopicManagement topics={topics} audiences={audiences} />
          </TabsContent>

          <TabsContent value="audiences" className="outline-none">
            <AudienceManagement audiences={audiences} />
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
}
