import ErrorLanding from "@/components/landing/error-landing";
import PartidosList from "@/components/politics/partidos-list";
import { PartidoDetail } from "@/interfaces/politics";
import { publicApi } from "@/lib/public-api";


const PartidoPage = async () => {
  try {
    // Obtener datos en paralelo
    const [partidos] = await Promise.all([
      publicApi.getPartidos(true) as Promise<PartidoDetail[]>,
    ]);

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Partidos Políticos del Perú
            </h1>
            <p className="text-muted-foreground">
              Conoce la información completa de los partidos políticos activos
            </p>
          </div>

          <PartidosList partidos={partidos} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
};

export default PartidoPage;
