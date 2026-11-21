"use client";

import { FALLBACK_INSTITUTION, type Institution } from "@/config/institutions";
import { useGetInstitutionsQuery } from "@/services/api/endpoints/settingsApi";
import { useAppSelector } from "@/store/hooks";

/** The selected institution (id kept in the ui slice; details from `GET /institutions`). */
export function useCurrentInstitution(): Institution {
  const id = useAppSelector((s) => s.ui.institutionId);
  const { data } = useGetInstitutionsQuery();
  return data?.find((i) => i.id === id) ?? data?.[0] ?? FALLBACK_INSTITUTION;
}
