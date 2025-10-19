import Link from "next/link";
import { Plus, Upload, Download, Edit, Trash, Settings } from "lucide-react";

interface Action {
  label: string;
  href: string;
  icon: "plus" | "upload" | "download" | "edit" | "trash" | "settings";
  variant?: "primary" | "secondary" | "danger";
}

interface AdminActionsProps {
  actions: Action[];
}

const iconMap = {
  plus: Plus,
  upload: Upload,
  download: Download,
  edit: Edit,
  trash: Trash,
  settings: Settings,
};

const variantStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

export default function AdminActions({ actions }: AdminActionsProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-lg p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Acciones de Administrador
        </h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {actions.map((action, index) => {
          const Icon = iconMap[action.icon];
          const variant = action.variant || "secondary";
          const isExternal = action.href.startsWith("http") || action.href.startsWith("/api");

          const buttonContent = (
            <>
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </>
          );

          const buttonClasses = `
            inline-flex items-center gap-2 px-4 py-2 rounded-lg 
            font-medium transition-colors
            ${variantStyles[variant]}
          `;

          if (isExternal) {
            return (
              <a
                key={index}
                href={action.href}
                className={buttonClasses}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  action.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
              >
                {buttonContent}
              </a>
            );
          }

          return (
            <Link key={index} href={action.href} className={buttonClasses}>
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}