const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { User } = require("../models");

const ALLOWED_ROLES = ["ADMIN", "STAFF", "CUSTOMER"];

const SAFE_ATTRIBUTES = {
  exclude: ["passwordHash"],
};

// GET /api/admin/users
async function getAllUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const offset = (page - 1) * limit;
    const where = {};

    // Filter by role only when a specific role is selected.
    if (req.query.role) {
      const role = String(req.query.role).trim().toUpperCase();

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Use ADMIN, STAFF, or CUSTOMER.",
        });
      }

      where.role = role;
    }

    // Filter by account status.
    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      where.isActive = req.query.isActive === "true";
    }

    // Search by name, email, or phone.
    if (
      typeof req.query.search === "string" &&
      req.query.search.trim()
    ) {
      const search = req.query.search.trim();

      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: SAFE_ATTRIBUTES,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

// POST /api/admin/users
async function createUser(req, res, next) {
  try {
    const { fullName, email, phone, password, role, isActive } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof role !== "string" ||
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email, a password of at least 8 characters, and a valid role are required.",
      });
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone:
        typeof phone === "string" ? phone.trim() || null : null,
      passwordHash,
      role,
      isActive: isActive ?? true,
    });

    const safeUser = await User.findByPk(user.id, {
      attributes: SAFE_ATTRIBUTES,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: { user: safeUser },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email or another unique field already exists.",
      });
    }

    return next(error);
  }
}

// PATCH /api/admin/users/:id
async function updateUser(req, res, next) {
  try {
    const id = req.params.id;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
      role,
      isActive,
    } = req.body;

    const updates = {};

    if (fullName !== undefined) {
      if (
        typeof fullName !== "string" ||
        !fullName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Full name cannot be empty.",
        });
      }

      updates.fullName = fullName.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid email address is required.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        where: {
          email: normalizedEmail,
          id: { [Op.ne]: user.id },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already used by another account.",
        });
      }

      updates.email = normalizedEmail;
    }

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be a string or null.",
        });
      }

      updates.phone =
        typeof phone === "string" ? phone.trim() || null : null;
    }

    if (role !== undefined) {
      if (
        typeof role !== "string" ||
        !ALLOWED_ROLES.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Use ADMIN, STAFF, or CUSTOMER.",
        });
      }

      if (
        String(user.id) === String(req.user.id) &&
        role !== "ADMIN"
      ) {
        return res.status(400).json({
          success: false,
          message: "You cannot remove your own ADMIN role.",
        });
      }

      updates.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }

      if (
        String(user.id) === String(req.user.id) &&
        isActive === false
      ) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account.",
        });
      }

      updates.isActive = isActive;
    }

    if (password !== undefined) {
      if (
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be between 8 and 72 characters.",
        });
      }

      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid user fields were provided for updating.",
      });
    }

    await user.update(updates);

    const safeUser = await User.findByPk(user.id, {
      attributes: SAFE_ATTRIBUTES,
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: { user: safeUser },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email or another unique field already exists.",
      });
    }

    return next(error);
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
};