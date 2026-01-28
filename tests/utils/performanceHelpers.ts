/**
 * Measures the execution time of an async function
 * @param fn - Function to measure
 * @returns Object containing result and execution time in milliseconds
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  return { result, executionTime };
}

/**
 * Measures the execution time of a synchronous function
 * @param fn - Function to measure
 * @returns Object containing result and execution time in milliseconds
 */
export function measurePerformanceSync<T>(
  fn: () => T
): { result: T; executionTime: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  return { result, executionTime };
}

/**
 * Runs a function multiple times and returns average execution time
 * @param fn - Function to measure
 * @param iterations - Number of times to run the function
 * @returns Average execution time in milliseconds
 */
export async function measureAveragePerformance<T>(
  fn: () => Promise<T>,
  iterations: number = 10
): Promise<{ averageTime: number; minTime: number; maxTime: number }> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { executionTime } = await measurePerformance(fn);
    times.push(executionTime);
  }

  return {
    averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  };
}

/**
 * Asserts that a function executes within a given time limit
 * @param fn - Function to measure
 * @param maxTime - Maximum allowed execution time in milliseconds
 */
export async function expectWithinTime<T>(
  fn: () => Promise<T>,
  maxTime: number
): Promise<T> {
  const { result, executionTime } = await measurePerformance(fn);

  if (executionTime > maxTime) {
    throw new Error(
      `Performance expectation failed: Expected execution time to be less than ${maxTime}ms, but was ${executionTime.toFixed(2)}ms`
    );
  }

  return result;
}
