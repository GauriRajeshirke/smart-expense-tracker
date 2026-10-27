import { validationResult } from "express-validator";

// Runs after the validation rules in a route. If any rule failed, reply 400
// with a readable message and stop; otherwise continue to the controller.
export default function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ message: errors[0].message, errors });
}
