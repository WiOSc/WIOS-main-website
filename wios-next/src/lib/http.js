/** Error carrying an HTTP status, e.g. httpError(403, "Requires admin role"). */
export const httpError = (status, message) => Object.assign(new Error(message), { status });

/**
 * Wraps a route handler so thrown errors become JSON responses:
 *   httpError(...) -> its status and message
 *   anything else  -> 500 "Internal server error" (details only in server log)
 * This replaces the Express error-handling middleware.
 */
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) console.error(err);
      return Response.json(
        { error: status === 500 ? "Internal server error" : err.message },
        { status }
      );
    }
  };
}
