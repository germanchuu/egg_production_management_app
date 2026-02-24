/**
 * Result Pattern for functional error handling
 *
 * Instead of throwing exceptions or using try-catch everywhere,
 * we use Result to make errors explicit and type-safe.
 */

export type Result<T, E = string> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E = string> {
  success: false;
  error: E;
  statusCode?: number;
}

// Helper constructors
export const ok = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

export const fail = <E = string>(
  error: E,
  statusCode: number = 400
): Failure<E> => ({
  success: false,
  error,
  statusCode,
});

// Type guards
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
  return result.success === true;
};

export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => {
  return result.success === false;
};
