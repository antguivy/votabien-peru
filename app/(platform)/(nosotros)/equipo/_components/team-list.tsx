import Link from "next/link";
import Image from "next/image";
import { Linkedin, Globe, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamBasic } from "@/interfaces/team";

interface TeamListProps {
  members: TeamBasic[];
}

export default function TeamList({ members }: TeamListProps) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No hay miembros del equipo para mostrar en este momento.
      </div>
    );
  }

  const principalMembers = members.filter((m) => m.is_principal);
  const otherMembers = members.filter((m) => !m.is_principal);

  return (
    <div className="space-y-20">
      {principalMembers.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-foreground">
              Equipo de Liderazgo
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {principalMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} isPrincipal />
            ))}
          </div>
        </section>
      )}

      {otherMembers.length > 0 && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-foreground">
              Colaboradores Voluntarios
            </h3>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {otherMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TeamMemberCard({
  member,
  isPrincipal = false,
}: {
  member: TeamBasic;
  isPrincipal?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-card transition-all duration-300",
        "border border-transparent hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5",
        !isPrincipal && "border-border/50",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted",
          "aspect-square",
        )}
      >
        {member.image_url ? (
          <Image
            src={member.image_url}
            alt={`${member.first_name} ${member.last_name}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
            <User
              className={cn(
                "stroke-[1.5]",
                isPrincipal ? "w-20 h-20" : "w-12 h-12",
              )}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="flex flex-1 flex-col p-5 space-y-3">
        <div className="space-y-1">
          <h4
            className={cn(
              "font-bold text-foreground leading-tight group-hover:text-primary transition-colors",
              isPrincipal ? "text-lg" : "text-base",
            )}
          >
            {member.first_name} {member.last_name}
          </h4>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {member.role}
          </p>
        </div>

        {member.email && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2 pt-2">
          {member.linkedin_url && (
            <SocialLink
              href={member.linkedin_url}
              icon={<Linkedin className="w-4 h-4" />}
              label="LinkedIn"
            />
          )}
          {member.portfolio_url && (
            <SocialLink
              href={member.portfolio_url}
              icon={<Globe className="w-4 h-4" />}
              label="Website / Portafolio"
            />
          )}
        </div>
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
      className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-secondary-foreground transition-all duration-200 hover:bg-primary hover:text-primary-foreground focus:ring-2 focus:ring-primary/20"
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Link>
  );
}
