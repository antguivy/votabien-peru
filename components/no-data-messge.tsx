import { Info } from "lucide-react";

export const NoDataMessage = ({
  text,
  icon: Icon = Info,
}: {
  text: string;
  icon?: React.ElementType;
}) => (
  <div className="flex items-center gap-3 text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">
    <Icon className="size-4 text-slate-400" />
    <span>{text}</span>
  </div>
);
