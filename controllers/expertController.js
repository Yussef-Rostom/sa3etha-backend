const User = require("../models/User");
const SubService = require("../models/SubService");
const mongoose = require("mongoose");
const { getGovernorate } = require("../utils/locationHelper");
const { getGovernorateNameById, getGovernorateIdByName } = require("../constants/governorates");

const formatExpertResponse = (expert) => {
  const expertObj = expert.toObject ? expert.toObject() : expert;
  if (expertObj.governorate) {
    // expertObj.governorate is already the Name stored in DB
  }
  return expertObj;
};

// Get all available experts
const getAvailableExperts = async (req, res) => {
  try {
    const experts = await User.find({
      role: "expert",
      "expertProfile.isAvailable": true,
    })
      .select("-password -phone -email -fcmToken -refreshToken -otp -otpExpires -whatsapp")
      .populate({
        path: "expertProfile.serviceTypes.subServiceId",
        model: "SubService",
        populate: {
          path: "service",
          model: "Service",
        },
      });

    res.status(200).json({ experts: experts.map(formatExpertResponse) });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Get all near experts by service id
const getNearExperts = async (req, res) => {
  try {
    const { serviceId, subServiceId, coordinates, governorate, range } = req.query;

    let searchCoordinates;
    let searchGovernorate = getGovernorateNameById(governorate) || governorate;

    // If coordinates are provided in query, use them
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      const [long, lat] = coordinates.map(parseFloat);
      if (!isNaN(lat) && !isNaN(long)) {
        searchCoordinates = [long, lat];
      }
    }

    // If no coordinates/governorate provided and user is authenticated, try to use user's location
    if (!searchCoordinates && !searchGovernorate && req.user) {
      try {
        const user = await User.findById(req.user.id);
        if (user?.location?.coordinates) {
          const [long, lat] = user.location.coordinates.map(parseFloat);
          if (!isNaN(lat) && !isNaN(long)) {
            searchCoordinates = [long, lat];
          }
        }
        if (user?.governorate) {
          searchGovernorate = user.governorate;
        }
      } catch (userError) {
        // If user lookup fails, continue without user location
        console.error("Error fetching user location:", userError);
      }
    }

    const pipeline = [];

    if (searchCoordinates) {
      if (range) {
        pipeline.push({
          $geoNear: {
            near: { type: "Point", coordinates: searchCoordinates },
            distanceField: "distance",
            maxDistance: parseInt(range) * 1000,
            spherical: true,
            distanceMultiplier: 0.001,
          },
        });
      } else {
        const detectedGovernorate = getGovernorate(searchCoordinates[0], searchCoordinates[1]);
        if (detectedGovernorate) {
          pipeline.push({ $match: { governorate: detectedGovernorate } });
        }
      }
    } else if (searchGovernorate) {
      pipeline.push({
        $match: { governorate: searchGovernorate },
      });
    }

    const matchQuery = {
      role: "expert",
      "expertProfile.isAvailable": true,
    };

    if (subServiceId) {
      matchQuery["expertProfile.serviceTypes.subServiceId"] = new mongoose.Types.ObjectId(
        subServiceId,
      );
    } else if (serviceId) {
      const subServices = await SubService.find({ service: serviceId }).select(
        "_id",
      );
      const subServiceIds = subServices.map((s) => s._id);
      matchQuery["expertProfile.serviceTypes.subServiceId"] = { $in: subServiceIds };
    }

    pipeline.push({ $match: matchQuery });
    pipeline.push({
      $project: {
        password: 0,
        phone: 0,
        email: 0,
        fcmToken: 0,
        refreshToken: 0,
        otp: 0,
        otpExpires: 0,
        whatsapp: 0,
      },
    });

    const experts = await User.aggregate(pipeline);
    await User.populate(experts, {
      path: "expertProfile.serviceTypes.subServiceId",
      model: "SubService",
      populate: {
        path: "service",
        model: "Service",
      },
    });

    // Track user's last search if authenticated
    if (req.user && (serviceId || subServiceId)) {
      try {
        await User.findByIdAndUpdate(req.user.id, {
          lastSearch: {
            service: serviceId || null,
            subService: subServiceId || null,
            timestamp: new Date(),
          },
        });
      } catch (trackError) {
        // Log error but don't fail the request
        console.error("Error tracking user search:", trackError);
      }
    }

    res.status(200).json({ experts: experts.map(formatExpertResponse) });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Update expert availability
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const expert = await User.findById(req.user.id);

    if (!expert) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!expert.expertProfile) {
      return res.status(400).json({ message: "Expert profile not found" });
    }

    expert.expertProfile.isAvailable = isAvailable;
    await expert.save();

    res.status(200).json({
      message: "Availability updated successfully",
      expert: {
        _id: expert._id,
        name: expert.name,
        isAvailable: expert.expertProfile.isAvailable,
        governorate: expert.governorate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Update expert profile
const updateExpertProfile = async (req, res) => {
  try {
    const {
      name,
      imageUrl,
      expertProfile: expertProfileUpdates,
    } = req.body;
    const phone = req.body.phone ? req.body.phone : undefined;

    const expert = await User.findById(req.user.id);

    if (!expert) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!expert.expertProfile) {
      return res.status(400).json({ message: "Expert profile not found" });
    }

    // Update top-level fields
    if (name) expert.name = name;
    if (phone && phone !== expert.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser._id.toString() !== expert._id.toString()) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      expert.phone = phone;
    }
    if (imageUrl) expert.imageUrl = imageUrl;

    // Update location using top-level coordinates and governorate
    if (req.body.coordinates) {
      const [lon, lat] = req.body.coordinates;
      const calculatedGovernorate = getGovernorate(lon, lat);
      expert.governorate =
        getGovernorateNameById(req.body.governorate) ||
        calculatedGovernorate ||
        expert.governorate;

      expert.location = {
        type: "Point",
        coordinates: req.body.coordinates,
      };
    }

    // Update nested expertProfile fields
    if (expertProfileUpdates) {
      const {
        serviceTypes,
        description,
      } = expertProfileUpdates;
      if (serviceTypes) expert.expertProfile.serviceTypes = serviceTypes;
      if (description) expert.expertProfile.description = description;
    }

    await expert.save();

    res.status(200).json({
      message: "Expert profile updated successfully",
      expert: {
        _id: expert._id,
        name: expert.name,
        phone: expert.phone,
        imageUrl: expert.imageUrl,
        location: expert.location,
        expertProfile: expert.expertProfile,
        governorate: expert.governorate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

const getExpertProfileById = async (req, res) => {
  try {
    const expert = await User.findById(req.params.id).select(
      "-password -phone -email -whatsapp",
    );
    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }
    res.status(200).json({ expert: formatExpertResponse(expert) });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

const addSubServiceToProfile = async (req, res) => {
  try {
    const { subServiceId } = req.params;
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    const subService = await SubService.findById(subServiceId);
    if (!subService) {
      return res.status(404).json({ message: "Sub-service not found" });
    }

    const { averagePricePerHour, yearsExperience } = req.body;

    const existingService = expert.expertProfile.serviceTypes.find(
      (s) => s.subServiceId.toString() === subServiceId
    );

    if (!existingService) {
      const newService = { subServiceId };
      if (averagePricePerHour !== undefined) {
        newService.averagePricePerHour = averagePricePerHour;
      }
      if (yearsExperience !== undefined) {
        newService.yearsExperience = yearsExperience;
      }
      expert.expertProfile.serviceTypes.push(newService);
      await expert.save();
    }

    res.status(200).json({
      message: "Sub-service added successfully",
      serviceTypes: expert.expertProfile.serviceTypes,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

const removeSubServiceFromProfile = async (req, res) => {
  try {
    const { subServiceId } = req.params;
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    expert.expertProfile.serviceTypes = expert.expertProfile.serviceTypes.filter(
      (s) => s.subServiceId.toString() !== subServiceId,
    );
    await expert.save();

    res.status(200).json({
      message: "Sub-service removed successfully",
      serviceTypes: expert.expertProfile.serviceTypes,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

const updateExpertStats = async (req, res) => {
  try {
    const { subServiceId, averagePricePerHour, yearsExperience } = req.body;
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    const serviceIndex = expert.expertProfile.serviceTypes.findIndex(
      (s) => s.subServiceId.toString() === subServiceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({ message: "Sub-service not found in expert profile" });
    }

    if (averagePricePerHour !== undefined) {
      expert.expertProfile.serviceTypes[serviceIndex].averagePricePerHour = averagePricePerHour;
    }
    if (yearsExperience !== undefined) {
      expert.expertProfile.serviceTypes[serviceIndex].yearsExperience = yearsExperience;
    }

    await expert.save();

    res.status(200).json({
      message: "Expert stats updated successfully",
      expertProfile: expert.expertProfile,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

module.exports = {
  getAvailableExperts,
  updateAvailability,
  updateExpertProfile,
  getNearExperts,
  getExpertProfileById,
  addSubServiceToProfile,
  removeSubServiceFromProfile,
  updateExpertStats,
};
