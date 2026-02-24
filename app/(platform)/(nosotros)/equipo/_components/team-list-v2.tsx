import Link from "next/link";
import Image from "next/image";
import { Linkedin, Globe, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamBasic } from "@/interfaces/team";

interface TeamListProps {
  members: TeamBasic[];
}

export default function TeamListV2({ members }: TeamListProps) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No hay miembros del equipo para mostrar en este momento.
      </div>
    );
  }

  const principalMembers = members.filter((m) => m.is_principal);

  if (principalMembers.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No hay miembros del equipo para mostrar en este momento.
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {principalMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

function TeamMemberCard({ member }: { member: TeamBasic }) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl",
        "bg-card border border-border dark:border-border/80",
        "transition-all duration-300",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10",
        "dark:hover:border-primary/30 dark:hover:shadow-primary/10",
      )}
    >
      {/* Foto */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted">
        {member.image_url ? (
          <Image
            src={member.image_url}
            alt={`${member.first_name} ${member.last_name}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary dark:bg-muted text-muted-foreground/40 group-hover:text-primary/50 transition-colors duration-300">
            <User className="w-20 h-20 stroke-[1.5]" />
          </div>
        )}

        {/* Overlay sutil al hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        {/* Nombre y rol */}
        <div className="space-y-1">
          <h4 className="text-lg font-bold leading-tight text-card-foreground group-hover:text-primary transition-colors duration-200">
            {member.first_name} {member.last_name}
          </h4>
          {member.role && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {member.role}
            </p>
          )}
        </div>

        {/* Separador */}
        <div className="h-px bg-border w-full" />

        {/* Email */}
        {member.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
            <span className="truncate">{member.email}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Links sociales */}
        {(member.linkedin_url || member.portfolio_url) && (
          <div className="flex items-center gap-2 pt-1">
            {member.linkedin_url && (
              <SocialLink
                href={member.linkedin_url}
                icon={<Linkedin className="w-3.5 h-3.5" />}
                label="LinkedIn"
              />
            )}
            {member.portfolio_url && (
              <SocialLink
                href={member.portfolio_url}
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Website / Portafolio"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-md",
        "bg-secondary text-secondary-foreground",
        "transition-all duration-200",
        "hover:bg-primary hover:text-primary-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Link>
  );
}
