"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Team member interface for displaying project team information
 */
export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  linkedin_url: string | null;
  portfolio_url: string | null;
  is_principal: boolean;
  email: string;
  role: string;
}

/**
 * Get all team members
 */
export async function getTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();

  //WIP
  const TABLE_NAME = "parliamentarygroup";

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
      role
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

/**
 * Get principal team members only
 */
export async function getPrincipalTeamMembers(): Promise<TeamMember[]> {
  const team = await getTeam();
  return team.filter((member) => member.is_principal);
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(
  id: string,
): Promise<TeamMember | null> {
  const team = await getTeam();
  return team.find((member) => member.id === id) || null;
}

/**
 * Get team members by role
 */
export async function getTeamMembersByRole(
  role: string,
): Promise<TeamMember[]> {
  const team = await getTeam();
  return team.filter(
    (member) => member.role.toLowerCase() === role.toLowerCase(),
  );
}
