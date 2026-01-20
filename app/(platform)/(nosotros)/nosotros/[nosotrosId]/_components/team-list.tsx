import Link from "next/link";
import Image from "next/image";
import { Linkedin, ExternalLink } from "lucide-react";
import { TeamMember } from "@/queries/public/team";

interface TeamListProps {
  members: TeamMember[];
}

export default function TeamList({ members }: TeamListProps) {
  if (!members || members.length === 0) {
    return null;
  }

  const principalMembers = members.filter((m) => m.is_principal);
  const otherMembers = members.filter((m) => !m.is_principal);

  return (
    <div className="space-y-12">
      {principalMembers.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Equipo Principal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {principalMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {otherMembers.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Colaboradores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {otherMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
      {member.image_url && (
        <div className="relative w-full h-48">
          <Image
            src={member.image_url}
            alt={`${member.first_name} ${member.last_name}`}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6 space-y-3">
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            {member.first_name} {member.last_name}
          </h4>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>

        <p className="text-sm text-muted-foreground">{member.email}</p>

        <div className="flex gap-2 pt-2">
          {member.linkedin_url && (
            <Link
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Link>
          )}
          {member.portfolio_url && (
            <Link
              href={member.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Portfolio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
