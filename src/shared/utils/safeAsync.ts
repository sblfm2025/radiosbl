export async function safeAsync<T>(
  label: string,
  task: () => Promise<T>,
  fallback?: T,
): Promise<T | undefined> {
  try {
    return await task();
  } catch (error) {
    console.warn(`[safeAsync:${label}]`, error);
    return fallback;
  }
}
