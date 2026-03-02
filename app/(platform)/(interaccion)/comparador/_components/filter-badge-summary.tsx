// "use client";

// import { FilterState } from "./filter-system";
// import { Badge } from "@/components/ui/badge";
// import {
//   Users,
//   Building2,
//   Scale,
//   Trophy,
//   UserCheck,
//   MapPin,
//   Flag,
//   X,
//   LucideIcon,
// } from "lucide-react";
// import { cn } from "@/lib/utils";

// interface FilterBadgeSummaryProps {
//   filters: FilterState;
//   onRemoveFilter?: (key: keyof FilterState) => void;
//   className?: string;
// }

// const getModeConfig = (
//   mode: string | null,
//   chamber: string | null,
//   type: string | null,
// ): { label: string; icon: LucideIcon } | null => {
//   if (!mode) return null;

//   if (mode === "legislator") {
//     return {
//       label: `Legislador - ${chamber || "General"}`,
//       icon: Users,
//     };
//   }

//   if (mode === "candidate") {
//     let icon = Users;
//     let label = "Candidato";

//     switch (type) {
//       case "PRESIDENTE":
//         icon = Trophy;
//         label = "Presidente";
//         break;
//       case "VICEPRESIDENTE":
//         icon = UserCheck;
//         label = "Vicepresidente";
//         break;
//       case "SENADOR":
//         icon = Building2;
//         label = "Senador";
//         break;
//       case "DIPUTADO":
//         icon = Scale;
//         label = "Diputado";
//         break;
//       default:
//         label = "Candidato";
//     }

//     return { label, icon };
//   }

//   return null;
// };

// export default function FilterBadgeSummary({
//   filters,
//   onRemoveFilter,
//   className,
// }: FilterBadgeSummaryProps) {
//   const badges = [];

//   const modeConfig = getModeConfig(filters.mode, filters.chamber, filters.type);

//   if (modeConfig) {
//     const Icon = modeConfig.icon;
//     badges.push(
//       <Badge key="mode" variant="default" className="gap-1.5 pr-1 capitalize">
//         <Icon className="h-3 w-3" />
//         {modeConfig.label.toLowerCase()}
//         {onRemoveFilter && (
//           <button
//             onClick={() => onRemoveFilter("mode")}
//             className="ml-1 hover:bg-primary-foreground/20 rounded-sm p-0.5"
//             aria-label="Remover filtro de modo"
//           >
//             <X className="h-2.5 w-2.5" />
//           </button>
//         )}
//       </Badge>,
//     );
//   }

//   if (filters.districts && filters.districts.length > 0) {
//     badges.push(
//       <Badge key="districts" variant="secondary" className="gap-1.5 pr-1">
//         <MapPin className="h-3 w-3" />
//         {filters.districts.length > 1
//           ? `${filters.districts.length} Distritos`
//           : filters.districts[0]}
//         {onRemoveFilter && (
//           <button
//             onClick={() => onRemoveFilter("districts")}
//             className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
//           >
//             <X className="h-2.5 w-2.5" />
//           </button>
//         )}
//       </Badge>,
//     );
//   }

//   if (filters.parties && filters.parties.length > 0) {
//     badges.push(
//       <Badge key="parties" variant="secondary" className="gap-1.5 pr-1">
//         <Flag className="h-3 w-3" />
//         {filters.parties.length > 1
//           ? `${filters.parties.length} Partidos`
//           : filters.parties[0]}
//         {onRemoveFilter && (
//           <button
//             onClick={() => onRemoveFilter("parties")}
//             className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
//           >
//             <X className="h-2.5 w-2.5" />
//           </button>
//         )}
//       </Badge>,
//     );
//   }

//   if (badges.length === 0) return null;

//   return <div className={cn("flex flex-wrap gap-2", className)}>{badges}</div>;
// }
