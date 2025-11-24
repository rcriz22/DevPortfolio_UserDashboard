
import { check, validationResult } from "express-validator";

export const validateProfileUpdate = [
  // validation for USERNAME
  check("username")
    .trim()
    .notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 50 }).withMessage("Username must be 3–50 characters")
    .matches(/^[A-Za-z0-9 _-]+$/).withMessage("Username contains invalid characters")
    .escape(),

  // validation for EMAIL
  check("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),

  // validation for BIO
  check("bio")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Bio must be under 500 characters")
    .matches(/^[A-Za-z0-9 .,!?'-]*$/)
    .withMessage("Bio contains invalid characters") 
    .escape(),

  // error
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array({ onlyFirstError: true })
      });
    }
    next();
  }
];
