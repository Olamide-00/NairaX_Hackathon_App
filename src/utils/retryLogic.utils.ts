interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export class RetryError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(attempts: number, lastError: unknown) {
    const message =
      lastError instanceof Error ? lastError.message : "Unknown error";
    super(`Operation failed after ${attempts} attempt(s): ${message}`);
    this.name = "RetryError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

function computeDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.random() * 100;
  return Math.min(exponential + jitter, maxDelayMs);
}

function isRetryableAxiosError(error: unknown): boolean {
  const err = error as Record<string, unknown>;
  if (!err?.isAxiosError) return false;

  const response = err.response as { status?: number } | undefined;
  const status = response?.status;

  if (status === undefined) return true; 
  if (status === 429) return true; 
  if (status >= 500 && status < 600) return true;

  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 200,
    maxDelayMs = 5_000,
    shouldRetry = isRetryableAxiosError,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLast = attempt === maxAttempts;
      if (isLast || !shouldRetry(error, attempt)) break;

      const delayMs = computeDelay(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(error, attempt, delayMs);

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new RetryError(maxAttempts, lastError);
}
