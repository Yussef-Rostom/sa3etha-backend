const User = require("../models/User");
const SubService = require("../models/SubService");
const mongoose = require("mongoose");
const { getGovernorate } = require("../utils/locationHelper");

// Get all available experts
const getAvailableExperts = async (req, res) => {
  try {
    const experts = await User.find({
      role: "expert",
      "expertProfile.isAvailable": true,
    })
      .select("-phone")
      .populate("expertProfile.serviceTypes expertProfile.averagePricePerHour");
    res.status(200).json({ experts });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Update expert availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    expert.expertProfile.isAvailable = isAvailable;
    await expert.save();

    res.status(200).json({
      message: "Availability updated successfully",
      expert,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Update expert profile
const updateExpertProfile = async (req, res) => {
  try {
    const { name, phone, imageUrl, location, ...restOfBody } = req.body;
    const { averageRating, ...expertProfileFields } = restOfBody;
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (phone && phone !== expert.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      expert.phone = phone;
    }

    if (name) {
      expert.name = name;
    }

    if (imageUrl) {
      expert.imageUrl = imageUrl;
    }

    if (location && location.coordinates) {
      const [lon, lat] = location.coordinates;
      const governorate = getGovernorate(lon, lat);
      console.log("Determined governorate:", governorate);
      expert.location.coordinates = location.coordinates;
      if (governorate) {
        expert.location.governorate = governorate;
      }
    }

    Object.assign(expert.expertProfile, expertProfileFields);

    await expert.save();

    res.status(200).json({
      message: "Expert profile updated successfully",
      expert,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Get all near experts by service id
const getNearExperts = async (req, res) => {
  let { serviceId, subServiceId, lat, long, range } = req.query;

  const pipeline = [];

  // Optional: Add geo-spatial query if lat and long are provided
  if (!lat || !long) {
    const user = await User.findById(req.user.id);
    if (user && user.location && user.location.coordinates) {
      long = user.location.coordinates[0];
      lat = user.location.coordinates[1];
    }
  }

  if (lat && long) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(long);

    if (!isNaN(latitude) && !isNaN(longitude)) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: range ? parseInt(range) * 1000 : 10000, // range in km
          spherical: true,
          distanceMultiplier: 0.001,
        },
      });
    }
  }

  const matchQuery = {
    role: "expert",
    "expertProfile.isAvailable": true,
  };

  try {
    if (subServiceId) {
      matchQuery["expertProfile.serviceTypes"] = new mongoose.Types.ObjectId(
        subServiceId
      );
    } else if (serviceId) {
      // Find sub-services for the given serviceId
      const subServices = await SubService.find({ service: serviceId }).select(
        "_id"
      );
      const subServiceIds = subServices.map((s) => s._id);

      // Find experts that have any of these sub-services
      matchQuery["expertProfile.serviceTypes"] = { $in: subServiceIds };
    }

    pipeline.push({
      $match: matchQuery,
    });

    pipeline.push({
      $project: {
        password: 0,
        phone: 0,
      },
    });

    let experts = await User.aggregate(pipeline);

    experts = await User.populate(experts, {
      path: "expertProfile.serviceTypes",
    });

    res.status(200).json({ experts });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

module.exports = {
  getAvailableExperts,
  updateAvailability,
  updateExpertProfile,
  getNearExperts,
};
