/** A customer, mirroring kuzco-server's `Customer` model (phone is the key). */
export interface Customer {
  _id: string;
  phone: string;
  /** Full name (ПІБ). */
  pib: string;
}
