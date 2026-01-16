// // comparador/_components/charts/radar-comparison-chart.tsx
// "use client";

// import { useMemo } from "react";
// import {
//   Chart as ChartJS,
//   RadialLinearScale,
//   PointElement,
//   LineElement,
//   Filler,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Radar } from "react-chartjs-2";
// import { LegislatorWithMetrics } from "@/interfaces/legislator-metrics";

// ChartJS.register(
//   RadialLinearScale,
//   PointElement,
//   LineElement,
//   Filler,
//   Tooltip,
//   Legend
// );

// interface RadarComparisonChartProps {
//   legislators: LegislatorWithMetrics[];
// }

// const COLORS = [
//   "rgba(59, 130, 246, 0.7)", // blue
//   "rgba(16, 185, 129, 0.7)", // green
//   "rgba(249, 115, 22, 0.7)", // orange
//   "rgba(168, 85, 247, 0.7)", // purple
// ];

// const BORDER_COLORS = [
//   "rgb(59, 130, 246)",
//   "rgb(16, 185, 129)",
//   "rgb(249, 115, 22)",
//   "rgb(168, 85, 247)",
// ];

// export default function RadarComparisonChart({
//   legislators,
// }: RadarComparisonChartProps) {
//   const chartData = useMemo(() => {
//     const datasets = legislators.map((item, index) => {
//       const metrics = item.metrics;
//       const color = item.legislator.current_parliamentary_group?.color_hex;

//       // Normalizar métricas a escala 0-100
//       const normalizeRate = (value: number | null) =>
//         value !== null ? Math.round(value) : 0;

//       const approvalRate = normalizeRate(metrics.approval_rate);
//       const attendanceRate = normalizeRate(metrics.attendance_rate);

//       // Productividad: bills aprobados vs total (si tiene proyectos)
//       const productivity =
//         metrics.total_bills > 0
//           ? Math.round((metrics.bills_aprobado / metrics.total_bills) * 100)
//           : 0;

//       // Estabilidad: inverso de cambios de bancada (0 cambios = 100, 3+ = 0)
//       const stability = Math.max(
//         0,
//         100 - metrics.total_party_changes * 33
//       );

//       // Integridad: inverso de antecedentes activos
//       const integrity = Math.max(
//         0,
//         100 - (metrics.penal_records + metrics.ethical_records) * 20
//       );

//       return {
//         label: item.legislator.person.fullname,
//         data: [
//           attendanceRate,
//           approvalRate,
//           productivity,
//           stability,
//           integrity,
//         ],
//         backgroundColor: color
//           ? `${color}33` // 20% opacity
//           : COLORS[index % COLORS.length],
//         borderColor: color || BORDER_COLORS[index % BORDER_COLORS.length],
//         borderWidth: 2,
//         pointBackgroundColor: color || BORDER_COLORS[index % BORDER_COLORS.length],
//         pointBorderColor: "#fff",
//         pointHoverBackgroundColor: "#fff",
//         pointHoverBorderColor: color || BORDER_COLORS[index % BORDER_COLORS.length],
//       };
//     });

//     return {
//       labels: [
//         "Asistencia",
//         "Aprobación",
//         "Productividad",
//         "Estabilidad",
//         "Integridad",
//       ],
//       datasets,
//     };
//   }, [legislators]);

//   const options = {
//     responsive: true,
//     maintainAspectRatio: true,
//     aspectRatio: window.innerWidth < 768 ? 1 : 2,
//     scales: {
//       r: {
//         beginAtZero: true,
//         max: 100,
//         ticks: {
//           stepSize: 20,
//           font: {
//             size: window.innerWidth < 768 ? 10 : 12,
//           },
//         },
//         pointLabels: {
//           font: {
//             size: window.innerWidth < 768 ? 11 : 13,
//             weight: 600,
//           },
//         },
//       },
//     },
//     plugins: {
//       legend: {
//         position: "bottom" as const,
//         labels: {
//           padding: window.innerWidth < 768 ? 10 : 15,
//           font: {
//             size: window.innerWidth < 768 ? 11 : 12,
//           },
//           usePointStyle: true,
//           pointStyle: "circle",
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context: any) {
//             return `${context.dataset.label}: ${context.parsed.r}%`;
//           },
//         },
//       },
//     },
//   };

//   return (
//     <div className="w-full">
//       <Radar data={chartData} options={options} />
//       <div className="mt-4 text-center text-sm text-muted-foreground">
//         <p className="hidden md:block">
//           Puntajes normalizados de 0 a 100 para facilitar la comparación
//         </p>
//       </div>
//     </div>
//   );
// }
