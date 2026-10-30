
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { User } = require("../models");

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(150),
  password: z.string().min(1).max(72),
});

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration information.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { fullName, email, phone, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      role: "CUSTOMER",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token: createToken(user),
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    next(error);
  }
}

async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password.",
      });
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        token: createToken(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    data: { user: req.user },
  });
}


async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Please remove your authentication token.",
  });
}


async function updateProfile(req, res, next) {
  try {
    const updateProfileSchema = z
      .object({
        fullName: z.string().trim().min(2).max(150).optional(),

        email: z
          .string()
          .trim()
          .email()
          .max(150)
          .optional(),

        phone: z
          .union([z.string().trim().max(30), z.literal("")])
          .nullable()
          .optional(),
      })
      .refine(
        (data) =>
          data.fullName !== undefined ||
          data.email !== undefined ||
          data.phone !== undefined,
        {
          message: "Provide at least one field to update.",
        }
      );

    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile information.",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Get the authenticated user's ID from the auth middleware.
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const updates = {};

    if (parsed.data.fullName !== undefined) {
      updates.fullName = parsed.data.fullName;
    }

    if (parsed.data.email !== undefined) {
      updates.email = parsed.data.email.toLowerCase();
    }

    if (parsed.data.phone !== undefined) {
      updates.phone = parsed.data.phone || null;
    }

    // Check whether the email belongs to another account.
    if (updates.email !== undefined) {
      const existingUser = await User.findOne({
        where: {
          email: updates.email,
        },
      });

      if (
        existingUser &&
        Number(existingUser.id) !== Number(user.id)
      ) {
        return res.status(409).json({
          success: false,
          message: "This email address is already registered.",
        });
      }
    }

    await user.update(updates);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    return next(error);
  }
}

async function updatePassword(req, res, next) {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, "Current password is required."),
      newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters long.")
        .max(72, "New password is too long."),
      confirmPassword: z.string().min(1, "Please confirm your new password."),
    }).refine(
      (data) => data.newPassword === data.confirmPassword,
      {
        message: "New passwords do not match.",
        path: ["confirmPassword"],
      }
    );

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Your current password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "Your new password must be different from your current password.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = { register, login, getMe, logout, updateProfile, updatePassword };
