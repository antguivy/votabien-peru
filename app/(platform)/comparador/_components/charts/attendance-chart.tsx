// // comparador/_components/charts/attendance-chart.tsx
// "use client";

// import { useMemo } from "react";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Bar } from "react-chartjs-2";
// import { LegislatorWithMetrics } from "@/interfaces/legislator-metrics";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// interface AttendanceChartProps {
//   legislators: LegislatorWithMetrics[];
// }

// export default function AttendanceChart({
//   legislators,
// }: AttendanceChartProps) {
//   const chartData = useMemo(() => {
//     const labels = legislators.map(
//       (item) => item.legislator.person.fullname.split(" ").slice(0, 2).join(" ")
//     );

//     const datasets = [
//       {
//         label: "Presente",
//         data: legislators.map((item) => item.metrics.sessions_present),
//         backgroundColor: "rgba(16, 185, 129, 0.7)",
//         borderColor: "rgb(16, 185, 129)",
//         borderWidth: 1,
//       },
//       {
//         label: "Faltas",
//         data: legislators.map((item) => item.metrics.sessions_absent),
//         backgroundColor: "rgba(239, 68, 68, 0.7)",
//         borderColor: "rgb(239, 68, 68)",
//         borderWidth: 1,
//       },
//       {
//         label: "Justificadas",
//         data: legislators.map((item) => item.metrics.sessions_justified),
//         backgroundColor: "rgba(251, 191, 36, 0.7)",
//         borderColor: "rgb(251, 191, 36)",
//         borderWidth: 1,
//       },
//       {
//         label: "Licencias",
//         data: legislators.map((item) => item.metrics.sessions_license),
//         backgroundColor: "rgba(147, 197, 253, 0.7)",
//         borderColor: "rgb(147, 197, 253)",
//         borderWidth: 1,
//       },
//     ];

//     return { labels, datasets };
//   }, [legislators]);

//   const options = {
//     responsive: true,
//     maintainAspectRatio: true,
//     aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
//     scales: {
//       x: {
//         stacked: true,
//         ticks: {
//           font: {
//             size: window.innerWidth < 768 ? 10 : 12,
//           },
//           maxRotation: window.innerWidth < 768 ? 45 : 0,
//           minRotation: window.innerWidth < 768 ? 45 : 0,
//         },
//       },
//       y: {
//         stacked: true,
//         beginAtZero: true,
//         ticks: {
//           font: {
//             size: window.innerWidth < 768 ? 10 : 12,
//           },
//         },
//         title: {
//           display: true,
//           text: "Número de sesiones",
//           font: {
//             size: window.innerWidth < 768 ? 11 : 13,
//           },
//         },
//       },
//     },
//     plugins: {
//       legend: {
//         position: "bottom" as const,
//         labels: {
//           padding: window.innerWidth < 768 ? 8 : 15,
//           font: {
//             size: window.innerWidth < 768 ? 10 : 12,
//           },
//           usePointStyle: true,
//           pointStyle: "circle",
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context: any) {
//             return `${context.dataset.label}: ${context.parsed.y} sesiones`;
//           },
//           footer: function (tooltipItems: any) {
//             const index = tooltipItems[0].dataIndex;
//             const legislator = legislators[index];
//             const rate = legislator.metrics.attendance_rate;
//             return rate !== null ? `Tasa: ${rate.toFixed(1)}%` : "";
//           },
//         },
//       },
//     },
//   };

//   return (
//     <div className="w-full">
//       <Bar data={chartData} options={options} />
//       <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
//         {legislators.map((leg) => (
//           <div
//             key={leg.legislator.id}
//             className="text-center p-3 bg-muted/50 rounded-lg"
//           >
//             <div className="text-xs md:text-sm text-muted-foreground mb-1 truncate">
//               {leg.legislator.person.fullname.split(" ").slice(0, 2).join(" ")}
//             </div>
//             <div className="text-xl md:text-2xl font-bold">
//               {leg.metrics.attendance_rate !== null
//                 ? `${leg.metrics.attendance_rate.toFixed(1)}%`
//                 : "N/A"}
//             </div>
//             <div className="text-xs text-muted-foreground">Asistencia</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
