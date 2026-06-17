/**
 * Investment domain type, mirroring kuzco-server's `finance/model/investment.ts`.
 * Amounts are plain UAH numbers (unlike expenses, which are negative kopiykas).
 */
export interface Investment {
  _id: string;
  /** User id of the investor. */
  userId: string;
  amount: number;
  /** ISO date string. */
  date: string;
}
