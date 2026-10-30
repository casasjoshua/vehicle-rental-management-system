
const { Op } = require("sequelize");
const { User, Vehicle, Booking } = require("../models");

const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

const USER_ROLES = ["ADMIN", "STAFF", "CUSTOMER"];

const REVENUE_STATUSES = ["CONFIRMED", "COMPLETED"];

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const hasAttribute = (Model, attribute) =>
  Boolean(Model.rawAttributes?.[attribute]);

const getExistingAttributes = (Model, attributes) =>
  attributes.filter((attribute) => hasAttribute(Model, attribute));

const getDateRange = (query) => {
  const where = {};
  const createdAt = {};

  if (query.from) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.from)) {
      throw new Error("Invalid from date. Use YYYY-MM-DD.");
    }

    const from = new Date(`${query.from}T00:00:00.000Z`);

    if (
      Number.isNaN(from.getTime()) ||
      from.toISOString().slice(0, 10) !== query.from
    ) {
      throw new Error("Invalid from date.");
    }

    createdAt[Op.gte] = from;
  }

  if (query.to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
      throw new Error("Invalid to date. Use YYYY-MM-DD.");
    }

    const to = new Date(`${query.to}T00:00:00.000Z`);

    if (
      Number.isNaN(to.getTime()) ||
      to.toISOString().slice(0, 10) !== query.to
    ) {
      throw new Error("Invalid to date.");
    }

    // Exclusive upper bound includes the whole selected calendar day.
    to.setUTCDate(to.getUTCDate() + 1);
    createdAt[Op.lt] = to;
  }

  if (
    createdAt[Op.gte] &&
    createdAt[Op.lt] &&
    createdAt[Op.gte] >= createdAt[Op.lt]
  ) {
    throw new Error("'from' date must not be after 'to' date.");
  }

  if (Object.keys(createdAt).length > 0) {
    if (!hasAttribute(Booking, "createdAt")) {
      throw new Error(
        "Date filtering requires Sequelize timestamps on the Booking model."
      );
    }

    where.createdAt = createdAt;
  }

  return where;
};

const handleError = (res, error) => {
  console.error("Reports API error:", error);

  const isValidationError =
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeDatabaseError" ||
    error.message?.toLowerCase().includes("date") ||
    error.message?.toLowerCase().includes("invalid");

  return res.status(isValidationError ? 400 : 500).json({
    success: false,
    message:
      error.message || "An error occurred while generating the report.",
  });
};

const sendSuccess = (res, message, data) =>
  res.status(200).json({
    success: true,
    message,
    data,
  });

const getStatusCounts = (items, field = "status") => {
  const result = {};

  for (const item of items) {
    const status = item[field] || "UNKNOWN";
    result[status] = (result[status] || 0) + 1;
  }

  return result;
};

/**
 * GET /api/reports/summary
 * Optional query parameters:
 * ?from=2026-01-01&to=2026-12-31
 *
 * Revenue includes CONFIRMED and COMPLETED bookings.
 */
exports.getSummary = async (req, res) => {
  try {
    const dateWhere = getDateRange(req.query);

    const revenueWhere = {
      ...dateWhere,
      status: {
        [Op.in]: REVENUE_STATUSES,
      },
    };

    const [
      totalUsers,
      totalAdmins,
      totalStaff,
      totalCustomers,
      totalVehicles,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      vehicleStatuses,
    ] = await Promise.all([
      User.count(),

      User.count({
        where: { role: "ADMIN" },
      }),

      User.count({
        where: { role: "STAFF" },
      }),

      User.count({
        where: { role: "CUSTOMER" },
      }),

      Vehicle.count(),

      Booking.count({
        where: dateWhere,
      }),

      Booking.count({
        where: { ...dateWhere, status: "PENDING" },
      }),

      Booking.count({
        where: { ...dateWhere, status: "CONFIRMED" },
      }),

      Booking.count({
        where: { ...dateWhere, status: "REJECTED" },
      }),

      Booking.count({
        where: { ...dateWhere, status: "CANCELLED" },
      }),

      Booking.count({
        where: { ...dateWhere, status: "COMPLETED" },
      }),

      Booking.sum("totalAmount", {
        where: revenueWhere,
      }),

      Vehicle.findAll({
        attributes: getExistingAttributes(Vehicle, ["status"]),
        raw: true,
      }),
    ]);

    const vehiclesByStatus = getStatusCounts(vehicleStatuses);

    return sendSuccess(res, "Report summary retrieved successfully.", {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        staff: totalStaff,
        customers: totalCustomers,
      },

      vehicles: {
        total: totalVehicles,
        byStatus: vehiclesByStatus,
      },

      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        rejected: rejectedBookings,
        cancelled: cancelledBookings,
        completed: completedBookings,
      },

      revenue: {
        total: toNumber(totalRevenue),
        currency: "PHP",
        statusesIncluded: REVENUE_STATUSES,
        note:
          "Revenue is the booking value for confirmed and completed bookings. It is not verified payment revenue.",
      },

      filters: {
        from: req.query.from || null,
        to: req.query.to || null,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/reports/monthly?year=2026
 *
 * Groups bookings by their creation month.
 * Revenue includes CONFIRMED and COMPLETED bookings.
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = Number(req.query.year || currentYear);

    if (
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year between 2000 and 2100.",
      });
    }

    if (!hasAttribute(Booking, "createdAt")) {
      throw new Error(
        "Monthly reports require Sequelize timestamps on the Booking model."
      );
    }

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    const bookings = await Booking.findAll({
      attributes: ["id", "createdAt", "status", "totalAmount"],
      where: {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      label: new Date(Date.UTC(year, index, 1)).toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC",
      }),
      bookings: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    }));

    for (const booking of bookings) {
      const date = new Date(booking.createdAt);
      const month = monthlyData[date.getUTCMonth()];

      if (!month) continue;

      month.bookings += 1;

      if (booking.status === "CONFIRMED") {
        month.confirmed += 1;
        month.revenue += toNumber(booking.totalAmount);
      }

      if (booking.status === "COMPLETED") {
        month.completed += 1;
        month.revenue += toNumber(booking.totalAmount);
      }

      if (booking.status === "CANCELLED") {
        month.cancelled += 1;
      }
    }

    const totals = monthlyData.reduce(
      (result, month) => ({
        bookings: result.bookings + month.bookings,
        confirmed: result.confirmed + month.confirmed,
        completed: result.completed + month.completed,
        cancelled: result.cancelled + month.cancelled,
        revenue: result.revenue + month.revenue,
      }),
      {
        bookings: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
      }
    );

    return sendSuccess(res, "Monthly report retrieved successfully.", {
      year,
      currency: "PHP",
      months: monthlyData,
      totals,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/reports/bookings
 * Optional:
 * ?page=1&limit=100&status=COMPLETED&from=2026-01-01&to=2026-12-31
 */
exports.getBookingReport = async (req, res) => {
  try {
    const requestedPage = Number(req.query.page || 1);
    const requestedLimit = Number(req.query.limit || 100);

    if (
      !Number.isInteger(requestedPage) ||
      requestedPage < 1 ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers.",
      });
    }

    const page = requestedPage;
    const limit = Math.min(500, requestedLimit);
    const where = getDateRange(req.query);

    if (req.query.status) {
      const status = String(req.query.status).toUpperCase();

      if (!BOOKING_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
          allowedStatuses: BOOKING_STATUSES,
        });
      }

      where.status = status;
    }

    const bookingAttributes = getExistingAttributes(Booking, [
      "id",
      "bookingNumber",
      "userId",
      "vehicleId",
      "startDate",
      "endDate",
      "pickupLocation",
      "returnLocation",
      "numberOfDays",
      "dailyRate",
      "totalAmount",
      "status",
      "createdAt",
    ]);

    const { count, rows } = await Booking.findAndCountAll({
      where,
      attributes: bookingAttributes,
      order: hasAttribute(Booking, "createdAt")
        ? [["createdAt", "DESC"]]
        : [["id", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    const bookingsJSON = rows.map((booking) => booking.toJSON());

    const userIds = [
      ...new Set(
        bookingsJSON
          .map((booking) => booking.userId)
          .filter((id) => id !== null && id !== undefined)
      ),
    ];

    const vehicleIds = [
      ...new Set(
        bookingsJSON
          .map((booking) => booking.vehicleId)
          .filter((id) => id !== null && id !== undefined)
      ),
    ];

    let users = [];
    let vehicles = [];

    if (userIds.length && hasAttribute(Booking, "userId")) {
      const userAttributes = getExistingAttributes(User, [
        "id",
        "fullName",
        "firstName",
        "lastName",
        "name",
        "email",
        "phone",
        "role",
      ]);

      users = await User.findAll({
        where: {
          id: {
            [Op.in]: userIds,
          },
        },
        attributes: userAttributes,
        raw: true,
      });
    }

    if (vehicleIds.length && hasAttribute(Booking, "vehicleId")) {
      const vehicleAttributes = getExistingAttributes(Vehicle, [
        "id",
        "name",
        "brand",
        "model",
        "plateNumber",
        "vehicleType",
        "dailyRate",
        "status",
      ]);

      vehicles = await Vehicle.findAll({
        where: {
          id: {
            [Op.in]: vehicleIds,
          },
        },
        attributes: vehicleAttributes,
        raw: true,
      });
    }

    const userMap = new Map(users.map((user) => [String(user.id), user]));
    const vehicleMap = new Map(
      vehicles.map((vehicle) => [String(vehicle.id), vehicle])
    );

    const reportBookings = bookingsJSON.map((booking) => {
      const customer =
        booking.userId !== undefined && booking.userId !== null
          ? userMap.get(String(booking.userId)) || null
          : null;

      const vehicle =
        booking.vehicleId !== undefined && booking.vehicleId !== null
          ? vehicleMap.get(String(booking.vehicleId)) || null
          : null;

      return {
        ...booking,
        customer,
        vehicle,
      };
    });

    return sendSuccess(res, "Booking report retrieved successfully.", {
      bookings: reportBookings,

      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },

      filters: {
        status: req.query.status || null,
        from: req.query.from || null,
        to: req.query.to || null,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/reports/vehicles
 *
 * Returns all vehicles and their booking statistics.
 */
exports.getVehicleReport = async (req, res) => {
  try {
    const vehicleAttributes = getExistingAttributes(Vehicle, [
      "id",
      "name",
      "brand",
      "model",
      "plateNumber",
      "vehicleType",
      "dailyRate",
      "status",
    ]);

    const vehicles = await Vehicle.findAll({
      attributes: vehicleAttributes,
      order: [["id", "DESC"]],
      raw: true,
    });

    const bookingAttributes = getExistingAttributes(Booking, [
      "vehicleId",
      "status",
      "totalAmount",
    ]);

    const bookingCounts = hasAttribute(Booking, "vehicleId")
      ? await Booking.findAll({
          attributes: bookingAttributes,
          raw: true,
        })
      : [];

    const statistics = new Map();

    for (const booking of bookingCounts) {
      if (booking.vehicleId === undefined || booking.vehicleId === null) {
        continue;
      }

      const id = String(booking.vehicleId);

      if (!statistics.has(id)) {
        statistics.set(id, {
          totalBookings: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          rejectedBookings: 0,
          revenue: 0,
        });
      }

      const item = statistics.get(id);
      item.totalBookings += 1;

      if (booking.status === "PENDING") {
        item.pendingBookings += 1;
      }

      if (booking.status === "CONFIRMED") {
        item.confirmedBookings += 1;
        item.revenue += toNumber(booking.totalAmount);
      }

      if (booking.status === "COMPLETED") {
        item.completedBookings += 1;
        item.revenue += toNumber(booking.totalAmount);
      }

      if (booking.status === "CANCELLED") {
        item.cancelledBookings += 1;
      }

      if (booking.status === "REJECTED") {
        item.rejectedBookings += 1;
      }
    }

    const reportVehicles = vehicles.map((vehicle) => ({
      ...vehicle,
      statistics: statistics.get(String(vehicle.id)) || {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        rejectedBookings: 0,
        revenue: 0,
      },
    }));

    return sendSuccess(res, "Vehicle report retrieved successfully.", {
      total: vehicles.length,
      byStatus: getStatusCounts(vehicles),
      vehicles: reportVehicles,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/reports/users
 *
 * Returns total users and role counts.
 * Active/inactive counts are included only if User.isActive exists.
 */
exports.getUserReport = async (req, res) => {
  try {
    const [total, roleCounts] = await Promise.all([
      User.count(),

      Promise.all(
        USER_ROLES.map(async (role) => ({
          role,
          count: await User.count({
            where: { role },
          }),
        }))
      ),
    ]);

    let active = null;
    let inactive = null;

    if (hasAttribute(User, "isActive")) {
      [active, inactive] = await Promise.all([
        User.count({
          where: { isActive: true },
        }),

        User.count({
          where: { isActive: false },
        }),
      ]);
    }

    return sendSuccess(res, "User report retrieved successfully.", {
      total,
      active,
      inactive,
      accountStatusAvailable: hasAttribute(User, "isActive"),
      byRole: Object.fromEntries(
        roleCounts.map((item) => [item.role, item.count])
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
