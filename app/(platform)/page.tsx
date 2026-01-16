import ErrorLanding from "@/components/landing/error-landing";
// import { ChamberType } from "@/interfaces/politics";
// import { Suspense } from "react";
import HeroDualSplit from "@/components/landing/hero-dual-split";
// import { Skeleton } from "@/components/ui/skeleton";
// import ComparadorServer from "@/components/comparador/comparador-server";
// import HemiclicleLegislator from "@/components/landing/hemicicle";
import Footer from "@/components/landing/footer";
import PartidosListBasic from "@/components/landing/partidos-list-basic";
import { getPartidosList } from "@/queries/public/parties";
import { getElectoralProcess } from "@/queries/public/electoral-process";
// import { getSeatParliamentary } from "@/queries/public/seats";
// import { ChamberType } from "@/interfaces/politics";

// function ComparadorSkeleton() {
//   return (
//     <section className="relative w-full min-h-screen bg-background overflow-hidden">
//       <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-background pointer-events-none" />
//       <div className="relative z-10 flex w-full h-full min-h-[720px]">
//         <div className="w-1/2 flex flex-col border-r border-border bg-card">
//           <div className="w-full aspect-[3/4]">
//             <Skeleton className="w-full h-full rounded-none" />
//           </div>
//           <div className="p-6 flex flex-col gap-3">
//             <Skeleton className="h-7 w-52 rounded-md" />
//             <Skeleton className="h-4 w-40 rounded-md" />
//             <Skeleton className="h-8 w-56 rounded-full" />{" "}
//             <Skeleton className="h-4 w-36 rounded-md" />
//             <Skeleton className="h-4 w-28 rounded-md" />
//           </div>
//           <div className="mt-auto border-t border-border px-6 py-5 bg-muted/30">
//             <div className="flex flex-col gap-3">
//               <Skeleton className="h-4 w-44 rounded-md" />
//               <Skeleton className="h-4 w-36 rounded-md" />
//               <Skeleton className="h-4 w-28 rounded-md" />
//             </div>
//           </div>
//         </div>
//         <div className="w-1/2 flex flex-col bg-card">
//           <div className="w-full aspect-[3/4]">
//             <Skeleton className="w-full h-full rounded-none" />
//           </div>
//           <div className="p-6 flex flex-col gap-3">
//             <Skeleton className="h-7 w-52 rounded-md" />
//             <Skeleton className="h-4 w-40 rounded-md" />
//             <Skeleton className="h-8 w-56 rounded-full" />{" "}
//             <Skeleton className="h-4 w-36 rounded-md" />
//             <Skeleton className="h-4 w-28 rounded-md" />
//           </div>
//           <div className="mt-auto border-t border-border px-6 py-5 bg-muted/30">
//             <div className="flex flex-col gap-3">
//               <Skeleton className="h-4 w-44 rounded-md" />
//               <Skeleton className="h-4 w-36 rounded-md" />
//               <Skeleton className="h-4 w-28 rounded-md" />
//             </div>
//           </div>
//         </div>
//       </div>
//       <div
//         aria-hidden
//         className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
//       >
//         <div className="relative flex items-center justify-center">
//           <div className="absolute w-20 h-20 rounded-full bg-gray-300/20 blur-md" />
//           <div className="relative w-16 h-16 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shadow-md">
//             <span className="text-sm font-semibold text-gray-700">VS</span>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

export default async function VotaBienPage() {
  try {
    const [
      partidos,
      proceso_electoral,
      // seats
    ] = await Promise.all([
      getPartidosList({
        active: true,
        limit: 8,
      }),
      getElectoralProcess(true),
      // getSeatParliamentary(ChamberType.CONGRESO),
    ]);

    // const seatsData = seats.sort((a, b) => {
    //   if (a.row !== b.row) return a.row - b.row;
    //   return a.number_seat - b.number_seat;
    // });
    return (
      <div className="min-h-screen ">
        {/* Hero Dual Split */}
        {/* <HeroDualSplit
          proceso_electoral={proceso_electoral[0]}
          ejecutivos={ejecutivos}
        /> */}
        <HeroDualSplit proceso_electoral={proceso_electoral[0]} />
        {/* <Suspense fallback={<ComparadorSkeleton />}>
          <ComparadorServer />
        </Suspense> */}

        {/* <HemiclicleLegislator seatsData={seatsData} /> */}

        <PartidosListBasic partidos={partidos.items} />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Error cargando datos de landing:", error);
    return <ErrorLanding />;
  }
}
