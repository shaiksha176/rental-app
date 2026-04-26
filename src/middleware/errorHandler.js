export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);

  // PostgreSQL error codes
  if (err.code === "23505") {
    return res.status(400).json({ error: "Unique constraint violation" });
  }

  if (err.code === "23503") {
    return res.status(400).json({ error: "Foreign key constraint violation" });
  }

  if (err.code === "23502") {
    return res.status(400).json({ error: "Not null constraint violation" });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not Found" });
}
