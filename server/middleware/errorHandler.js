// Used when no route matches the request
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Last stop for every error. Never sends internal details to the client.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(err.errors)[0].message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "That record already exists" });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
};
