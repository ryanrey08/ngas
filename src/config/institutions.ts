export interface Institution {
  id: string;
  name: string;
  shortName: string;
}

/**
 * Shown until `GET /institutions` answers (and if it fails), so the header and footer never
 * render empty. The real list always comes from the API.
 */
export const FALLBACK_INSTITUTION: Institution = { id: "mpc", name: "Marikina Polytechnic College", shortName: "MPC" };
