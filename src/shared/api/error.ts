import { isAxiosError } from "axios";

/**
 * Pull a user-facing message out of an error, honoring the server's
 * `{ statusCode?, message, paramMap }` contract (requirements §ERR-1).
 */
export function getErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return "Сталася помилка. Спробуйте ще раз.";
}
