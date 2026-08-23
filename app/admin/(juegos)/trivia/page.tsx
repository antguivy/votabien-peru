import { ContentLayout } from "@/components/admin/content-layout";
import { CreateTriviaButton, BulkImportButton } from "./_components/buttons";
import { TriviaList } from "./_components/trivia-list";
import { TopicManagement } from "./_components/topic-management";
import { AudienceManagement } from "./_components/audience-management";
import { getTrivias, getTopics, getAudiences } from "./_lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Layers,
  Users,
  CheckCircle2,
  FileQuestion,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
  const publishedCount = trivias.filter((t) => t.is_published).length;

  return (
    <ContentLayout title="Gestión de Trivia & Educación Cívica">
      <div className="space-y-6">
        {/* Métricas Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card/60 shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase">
                  Preguntas
                </p>
                <p className="text-2xl font-black text-foreground">
                  {trivias.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileQuestion size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase">
                  Publicadas
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {publishedCount}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase">
                  Temas
                </p>
                <p className="text-2xl font-black text-foreground">
                  {topics.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Layers size={18} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase">
                  Audiencias
                </p>
                <p className="text-2xl font-black text-foreground">
                  {audiences.length}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Users size={18} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Gestión */}
        <Tabs defaultValue="questions" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="questions" className="gap-2 text-xs">
                <HelpCircle size={15} />
                <span>Preguntas ({trivias.length})</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="gap-2 text-xs">
                <Layers size={15} />
                <span>Temas ({topics.length})</span>
              </TabsTrigger>
              <TabsTrigger value="audiences" className="gap-2 text-xs">
                <Users size={15} />
                <span>Audiencias ({audiences.length})</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <BulkImportButton topics={topics} audiences={audiences} />
              <CreateTriviaButton
                nextOrderIndex={nextAvailableIndex}
                topics={topics}
                audiences={audiences}
              />
            </div>
          </div>

          <TabsContent value="questions" className="space-y-4">
            <TriviaList
              trivias={trivias}
              nextOrderIndex={nextAvailableIndex}
              topics={topics}
              audiences={audiences}
            />
          </TabsContent>

          <TabsContent value="topics">
            <TopicManagement topics={topics} audiences={audiences} />
          </TabsContent>

          <TabsContent value="audiences">
            <AudienceManagement audiences={audiences} />
          </TabsContent>
        </Tabs>
      </div>
    </ContentLayout>
  );
}
