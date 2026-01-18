"use server";

import { createClient } from "@/lib/supabase/server";

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  linkedin_url: string | null;
  portfolio_url: string | null;
  is_principal: boolean;
  email: string;
  role: string;
  image_url: string | null;
}

export async function getTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();

  const TABLE_NAME = "team";

  const query = supabase
    .from(TABLE_NAME)
    .select(
      `
      id,
      first_name,
      last_name,
      linkedin_url,
      portfolio_url,
      is_principal,
      email,
      role,
      image_url
    `,
    )
    .order("first_name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener el equipo:", error);
    return [];
  }

  return data as unknown as TeamMember[];
}

export async function getPrincipalTeamMembers(): Promise<TeamMember[]> {
  const team = await getTeam();
  return team.filter((member) => member.is_principal);
}

export async function getTeamMemberById(
  id: string,
): Promise<TeamMember | null> {
  const team = await getTeam();
  return team.find((member) => member.id === id) || null;
}

export async function getTeamMembersByRole(
  role: string,
): Promise<TeamMember[]> {
  const team = await getTeam();
  return team.filter(
    (member) => member.role.toLowerCase() === role.toLowerCase(),
  );
}
