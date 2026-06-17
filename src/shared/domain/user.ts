/**
 * Staff user domain type, mirroring kuzco-server's `user` model. `POST /user/list`
 * returns raw Mongoose docs, so list items expose `_id`. Used to resolve order
 * counterparties and (later) assignee pickers (requirements §USR-2).
 */
export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
}

/** Display name for a user; falls back to an em dash when absent. */
export function userFullName(user?: User | null): string {
  if (!user) return "—";
  return `${user.name} ${user.surname}`.trim();
}
