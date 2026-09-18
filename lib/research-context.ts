import { prisma } from "@/lib/prisma";

export interface ResolvedPressSource {
  name: string;
  domain: string;
  scope: string;
}

export interface ResearchEntityContext {
  person_id: string;
  cargo: string;
  jurisdiccion: string;
  partido: string;
  press_sources: ResolvedPressSource[];
}

function formatLegislatorChamber(chamber: string | null | undefined): string {
  if (!chamber) return "CONGRESISTA";
  const upper = chamber.toUpperCase();
  if (upper.includes("SENAD")) return "SENADOR";
  if (upper.includes("DIPUTAD")) return "DIPUTADO";
  return "CONGRESISTA";
}

function buildJurisdictionString(
  district?: {
    name: string;
    parent?: {
      name: string;
      parent?: {
        name: string;
      } | null;
    } | null;
  } | null,
): string {
  if (!district) return "";
  const parts: string[] = [district.name];
  if (district.parent?.name && !parts.includes(district.parent.name)) {
    parts.push(district.parent.name);
  }
  if (
    district.parent?.parent?.name &&
    !parts.includes(district.parent.parent.name)
  ) {
    parts.push(district.parent.parent.name);
  }
  return parts.join(", ");
}

/**
 * Resolves electoral context and applicable press sources for a single person.
 * Polymorphically checks active candidate record, then active legislator record.
 */
export async function resolveResearchContext(
  personId: string,
): Promise<ResearchEntityContext> {
  const contexts = await resolveBatchResearchContexts([personId]);
  return (
    contexts[personId] || {
      person_id: personId,
      cargo: "",
      jurisdiccion: "",
      partido: "",
      press_sources: [],
    }
  );
}

/**
 * Resolves electoral context and applicable press sources for multiple persons in batch.
 * Executes optimized batch queries to prevent N+1 overhead.
 */
export async function resolveBatchResearchContexts(
  personIds: string[],
): Promise<Record<string, ResearchEntityContext>> {
  if (!personIds || personIds.length === 0) return {};

  const persons = await prisma.person.findMany({
    where: { id: { in: personIds } },
    select: {
      id: true,
      candidate: {
        where: { active: true },
        select: {
          type: true,
          electoraldistrict: {
            select: {
              id: true,
              name: true,
              parent_id: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  parent_id: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          politicalparty: {
            select: { name: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 1,
      },
      legislator: {
        where: { active: true },
        select: {
          chamber: true,
          electoraldistrict: {
            select: {
              id: true,
              name: true,
              parent_id: true,
              parent: {
                select: {
                  id: true,
                  name: true,
                  parent_id: true,
                  parent: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          politicalparty: {
            select: { name: true },
          },
        },
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
  });

  // Collect all applicable district IDs across all persons
  const personDistrictMap: Record<string, string[]> = {};
  const allReferencedDistrictIds = new Set<string>();

  for (const p of persons) {
    const activeCandidate = p.candidate?.[0];
    const activeLegislator = p.legislator?.[0];

    const district =
      activeCandidate?.electoraldistrict || activeLegislator?.electoraldistrict;

    const ids: string[] = [];
    if (district) {
      ids.push(district.id);
      allReferencedDistrictIds.add(district.id);
      if (district.parent_id) {
        ids.push(district.parent_id);
        allReferencedDistrictIds.add(district.parent_id);
      }
      if (district.parent?.parent_id) {
        ids.push(district.parent.parent_id);
        allReferencedDistrictIds.add(district.parent.parent_id);
      }
    }
    personDistrictMap[p.id] = ids;
  }

  // Query press sources: All active national sources + regional sources for any referenced district
  const allActiveSources = await prisma.press_source.findMany({
    where: {
      active: true,
      OR: [
        { scope: "NACIONAL" },
        ...(allReferencedDistrictIds.size > 0
          ? [
              {
                electoraldistrict_id: {
                  in: Array.from(allReferencedDistrictIds),
                },
              },
            ]
          : []),
      ],
    },
    select: {
      name: true,
      domain: true,
      scope: true,
      electoraldistrict_id: true,
    },
  });

  const nationalSources: ResolvedPressSource[] = allActiveSources
    .filter((s) => s.scope === "NACIONAL")
    .map((s) => ({ name: s.name, domain: s.domain, scope: s.scope }));

  const regionalByDistrictId = new Map<string, ResolvedPressSource[]>();
  for (const s of allActiveSources) {
    if (s.scope !== "NACIONAL" && s.electoraldistrict_id) {
      const list = regionalByDistrictId.get(s.electoraldistrict_id) || [];
      list.push({ name: s.name, domain: s.domain, scope: s.scope });
      regionalByDistrictId.set(s.electoraldistrict_id, list);
    }
  }

  const results: Record<string, ResearchEntityContext> = {};

  for (const p of persons) {
    const activeCandidate = p.candidate?.[0];
    const activeLegislator = p.legislator?.[0];

    let cargo = "";
    let jurisdiccion = "";
    let partido = "";

    if (activeCandidate) {
      cargo = activeCandidate.type || "";
      partido = activeCandidate.politicalparty?.name || "";
      jurisdiccion = buildJurisdictionString(activeCandidate.electoraldistrict);
    } else if (activeLegislator) {
      cargo = formatLegislatorChamber(activeLegislator.chamber);
      partido = activeLegislator.politicalparty?.name || "";
      jurisdiccion = buildJurisdictionString(
        activeLegislator.electoraldistrict,
      );
    }

    const matchedRegional = new Map<string, ResolvedPressSource>();
    const personDids = personDistrictMap[p.id] || [];
    for (const did of personDids) {
      const sourcesForDid = regionalByDistrictId.get(did) || [];
      for (const s of sourcesForDid) {
        matchedRegional.set(s.domain, s);
      }
    }

    const applicablePressSources: ResolvedPressSource[] = [
      ...nationalSources,
      ...Array.from(matchedRegional.values()),
    ];

    results[p.id] = {
      person_id: p.id,
      cargo,
      jurisdiccion,
      partido,
      press_sources: applicablePressSources,
    };
  }

  return results;
}
