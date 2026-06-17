/**
 * Balance domain type, mirroring kuzco-server's `finance/model/balance.ts`.
 * `value` is a plain UAH number for a single Monobank account.
 */
export interface Balance {
  _id: string;
  value: number;
  /** User id the account belongs to. */
  userId: string;
  title: string;
  accountId?: string;
}
