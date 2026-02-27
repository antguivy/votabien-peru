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
      <div className="flex flex-col sm:flex-row justify-center items-center sm:items-stretch gap-6">
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
        "group flex flex-col items-center text-center px-6 py-7 rounded-2xl w-full sm:w-64",
        "bg-card border border-border/60",
        "transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8",
        "hover:-translate-y-1",
      )}
    >
      {/* Foto circular */}
      <div className="relative w-28 h-28 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
        {member.image_url ? (
          <Image
            src={member.image_url}
            alt={`${member.first_name} ${member.last_name}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground/40 group-hover:text-primary/50 transition-colors duration-300">
            <User className="w-10 h-10 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Nombre y rol */}
      <div className="mt-4 space-y-1">
        <h4 className="text-sm font-bold leading-tight text-card-foreground group-hover:text-primary transition-colors duration-200">
          {member.first_name} {member.last_name}
        </h4>
        {member.role && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {member.role}
          </p>
        )}
      </div>

      {/* Email */}
      {member.email && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/60 max-w-full">
          <Mail className="w-3 h-3 flex-shrink-0 text-primary/50" />
          <span className="truncate">{member.email}</span>
        </div>
      )}

      {/* Links sociales */}
      {(member.linkedin_url || member.portfolio_url) && (
        <div className="mt-4 flex items-center gap-2">
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
        "inline-flex items-center justify-center w-7 h-7 rounded-full",
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
