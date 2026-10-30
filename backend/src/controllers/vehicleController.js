
const { Op } = require("sequelize");
const { Vehicle, Booking } = require("../models");

const VEHICLE_STATUSES = [
  "AVAILABLE",
  "UNAVAILABLE",
  "MAINTENANCE",
];

const ALLOWED_FIELDS = [
  "name",
  "brand",
  "model",
  "plateNumber",
  "vehicleType",
  "year",
  "seats",
  "dailyRate",
  "status",
  "imageUrl",
  "description",
];

function validateVehicleInput(body, isUpdate = false) {
  const errors = [];
  const data = {};

  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  const requiredFields = [
    "name",
    "brand",
    "model",
    "plateNumber",
    "vehicleType",
    "dailyRate",
  ];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        String(data[field]).trim() === ""
      ) {
        errors.push(`${field} is required.`);
      }
    }
  }

  const stringLimits = {
    name: 150,
    brand: 100,
    model: 100,
    plateNumber: 30,
    vehicleType: 50,
    imageUrl: 500,
  };

  for (const [field, maxLength] of Object.entries(stringLimits)) {
    if (data[field] !== undefined) {
      if (typeof data[field] !== "string" || !data[field].trim()) {
        errors.push(`${field} must be a non-empty string.`);
      } else if (data[field].trim().length > maxLength) {
        errors.push(`${field} must not exceed ${maxLength} characters.`);
      } else {
        data[field] = data[field].trim();
      }
    }
  }

  if (data.description !== undefined &&
      data.description !== null &&
      typeof data.description !== "string") {
    errors.push("description must be text.");
  }

  if (data.description?.length > 10000) {
    errors.push("description must not exceed 10000 characters.");
  }

  if (data.imageUrl === null) {
    // Allow removing an optional image URL.
  }

  if (data.year !== undefined && data.year !== null && data.year !== "") {
    const year = Number(data.year);

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      errors.push("year must be an integer between 1900 and 2100.");
    } else {
      data.year = year;
    }
  } else if (data.year === "") {
    data.year = null;
  }

  if (data.seats !== undefined) {
    const seats = Number(data.seats);

    if (!Number.isInteger(seats) || seats < 1) {
      errors.push("seats must be a positive integer.");
    } else {
      data.seats = seats;
    }
  }

  if (data.dailyRate !== undefined) {
    const rate = Number(data.dailyRate);

    if (!Number.isFinite(rate) || rate < 0) {
      errors.push("dailyRate must be a valid non-negative number.");
    } else if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(data.dailyRate))) {
      errors.push("dailyRate must have at most 2 decimal places.");
    } else {
      data.dailyRate = rate.toFixed(2);
    }
  }

  if (data.status !== undefined &&
      !VEHICLE_STATUSES.includes(data.status)) {
    errors.push(
      `status must be one of: ${VEHICLE_STATUSES.join(", ")}.`
    );
  }

  if (isUpdate && Object.keys(data).length === 0) {
    errors.push("Provide at least one valid vehicle field to update.");
  }

  return { errors, data };
}

// GET /api/vehicles
// Public: list vehicles with optional filters and pagination.
async function getAllVehicles(req, res, next) {
  try {
    const where = {};

    if (req.query.status !== undefined) {
      const status = String(req.query.status).toUpperCase();

      if (!VEHICLE_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle status filter.",
        });
      }

      where.status = status;
    }

    if (req.query.vehicleType) {
      where.vehicleType = {
        [Op.iLike]: `%${String(req.query.vehicleType).trim()}%`,
      };
    }

    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100);

      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { vehicleType: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const result = await Vehicle.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [["id", "DESC"]],
    });

    return res.json({
      success: true,
      data: {
        vehicles: result.rows,
        pagination: {
          total: result.count,
          page,
          limit,
          totalPages: Math.ceil(result.count / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/vehicles/available
// Public: show available vehicles only.
// GET /api/vehicles/available
// Public: return vehicles with availability for the requested rental dates.
async function getAvailableVehicles(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    // Both dates must be provided together.
    if (
      (startDate && !endDate) ||
      (!startDate && endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Both pickup and return dates are required.",
      });
    }

    // Validate YYYY-MM-DD and ensure the date is real.
    function isValidDate(value) {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }

    if (startDate && !isValidDate(startDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pickup date. Use YYYY-MM-DD.",
      });
    }

    if (endDate && !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return date. Use YYYY-MM-DD.",
      });
    }

    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "Return date must be on or after the pickup date.",
      });
    }

    // Include all vehicles so customers can see which ones
    // are unavailable for the selected dates.
    const vehicles = await Vehicle.findAll({
      order: [["id", "DESC"]],
    });

    // If no dates were provided, preserve the original behavior:
    // return vehicles whose general status is AVAILABLE.
    if (!startDate || !endDate) {
      const availableVehicles = vehicles
        .filter((vehicle) => vehicle.status === "AVAILABLE")
        .map((vehicle) => ({
          ...vehicle.toJSON(),
          isAvailable: true,
        }));

      return res.json({
        success: true,
        count: availableVehicles.length,
        data: {
          vehicles: availableVehicles,
        },
      });
    }

    // Find confirmed bookings that overlap the requested dates.
    const confirmedBookings = await Booking.findAll({
      where: {
        status: "CONFIRMED",
        startDate: {
          [Op.lte]: endDate,
        },
        endDate: {
          [Op.gte]: startDate,
        },
      },
      attributes: ["vehicleId"],
    });

    // Store vehicle IDs that already have a conflicting booking.
    const bookedVehicleIds = new Set(
      confirmedBookings.map((booking) =>
        String(booking.vehicleId)
      )
    );

    // Attach isAvailable to each vehicle.
    const vehiclesWithAvailability = vehicles.map((vehicle) => {
      const vehicleData = vehicle.toJSON();

      const isAvailable =
        vehicle.status === "AVAILABLE" &&
        !bookedVehicleIds.has(String(vehicle.id));

      return {
        ...vehicleData,
        isAvailable,
      };
    });

    const availableCount = vehiclesWithAvailability.filter(
      (vehicle) => vehicle.isAvailable
    ).length;

    return res.json({
      success: true,
      count: vehiclesWithAvailability.length,
      availableCount,
      data: {
        vehicles: vehiclesWithAvailability,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/vehicles/:id
// Public: view one vehicle.
async function getVehicleById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.json({
      success: true,
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/vehicles
// STAFF / ADMIN: create a vehicle.
async function createVehicle(req, res, next) {
  try {
    const { errors, data } = validateVehicleInput(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the vehicle information.",
        errors,
      });
    }

    const existing = await Vehicle.findOne({
      where: { plateNumber: data.plateNumber },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this plate number already exists.",
      });
    }

    const vehicle = await Vehicle.create(data);

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully.",
      data: { vehicle },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A vehicle with this plate number already exists.",
      });
    }

    next(error);
  }
}

// PUT /api/vehicles/:id
// STAFF / ADMIN: update vehicle details.
async function updateVehicle(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const { errors, data } = validateVehicleInput(req.body, true);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the vehicle information.",
        errors,
      });
    }

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    if (data.plateNumber) {
      const existing = await Vehicle.findOne({
        where: {
          plateNumber: data.plateNumber,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "That plate number belongs to another vehicle.",
        });
      }
    }

    await vehicle.update(data);

    return res.json({
      success: true,
      message: "Vehicle updated successfully.",
      data: { vehicle },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "That plate number belongs to another vehicle.",
      });
    }

    next(error);
  }
}

// PATCH /api/vehicles/:id/status
// STAFF / ADMIN: change only the vehicle status.
async function updateVehicleStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    if (!VEHICLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VEHICLE_STATUSES.join(", ")}.`,
      });
    }

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    await vehicle.update({ status });

    return res.json({
      success: true,
      message: "Vehicle status updated successfully.",
      data: { vehicle },
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/vehicles/:id
// ADMIN only: delete a vehicle.
async function deleteVehicle(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle ID.",
      });
    }

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    await vehicle.destroy();

    return res.json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  } catch (error) {
    if (
      error.name === "SequelizeForeignKeyConstraintError" ||
      error.original?.code === "23503"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This vehicle is referenced by existing bookings and cannot be deleted.",
      });
    }

    next(error);
  }
}

module.exports = {
  getAllVehicles,
  getAvailableVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
};
