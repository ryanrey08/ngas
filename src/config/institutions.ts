export interface Institution {
  id: string;
  name: string;
  shortName: string;
}

/** Agencies / institutions the signed-in user can switch between (mock; would come from the API). */
export const INSTITUTIONS: Institution[] = [
  { id: "mpc", name: "Marikina Polytechnic College", shortName: "MPC" },
  { id: "rsu", name: "Regional State University", shortName: "RSU" },
  { id: "pro", name: "Provincial Government Office", shortName: "PGO" },
];

export function getInstitution(id: string): Institution {
  return INSTITUTIONS.find((i) => i.id === id) ?? INSTITUTIONS[0];
}
