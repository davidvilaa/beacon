export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && /error 404/i.test(error.message);
}
