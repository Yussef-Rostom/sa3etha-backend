const User = require("../models/User");
const SubService = require("../models/SubService");
const mongoose = require("mongoose");
const { sendNotification } = require("../utils/sendNotification");
const { getGovernorate } = require("../utils/locationHelper");

const sendExpertSuggestions = async () => {
  console.log("Running cron job to send expert suggestions...");

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Find eligible users (users with active lastSearch)
    const eligibleUsers = await User.find({
      "lastSearch.timestamp": { $exists: true, $ne: null, $gte: twentyFourHoursAgo },
      // fcmToken check removed to allow saving notifications to DB for users without tokens
      $or: [
        { lastSuggestionSentAt: { $exists: false } },
        { lastSuggestionSentAt: null },
        { lastSuggestionSentAt: { $lte: oneHourAgo } },
      ],
    }).select("name fcmToken lastSearch location");

    console.log(`Found ${eligibleUsers.length} eligible users for suggestions`);

    for (const user of eligibleUsers) {
      try {
        // Check if 24 hours have passed since last search
        const searchAge = now - new Date(user.lastSearch.timestamp);
        if (searchAge > 24 * 60 * 60 * 1000) {
          // Auto-disable after 24 hours by clearing lastSearch
          await User.findByIdAndUpdate(user._id, {
            lastSearch: null,
          });
          console.log(`Auto-disabled suggestions for user ${user._id} (24h expired)`);
          continue;
        }

        // Build expert query
        const matchQuery = {
          role: "expert",
          "expertProfile.isAvailable": true,
        };

        // Filter by service/subService
        if (user.lastSearch.subService) {
          matchQuery["expertProfile.serviceTypes"] = user.lastSearch.subService;
        } else if (user.lastSearch.service) {
          const subServices = await SubService.find({
            service: user.lastSearch.service,
          }).select("_id");
          const subServiceIds = subServices.map((s) => s._id);
          matchQuery["expertProfile.serviceTypes"] = { $in: subServiceIds };
        }

        // Build aggregation pipeline
        const pipeline = [];

        // Geographic filtering
        if (user.location?.coordinates) {
          const userGovernorate = user.location.governorate;
          if (userGovernorate) {
            // Same governorate
            pipeline.push({
              $match: { "location.governorate": userGovernorate },
            });
          } else {
            // Use geo-near if no governorate
            pipeline.push({
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: user.location.coordinates,
                },
                distanceField: "distance",
                maxDistance: 50000, // 50km
                spherical: true,
              },
            });
          }
        }

        // Add main match query
        pipeline.push({ $match: matchQuery });

        // Sort by rating (descending)
        pipeline.push({
          $sort: { "expertProfile.averageRating": -1 },
        });

        // Limit to top 5 experts
        pipeline.push({ $limit: 5 });

        // Execute query
        const experts = await User.aggregate(pipeline);

        if (experts.length === 0) {
          console.log(`No experts found for user ${user._id}`);
          continue;
        }

        // Get service name and image for notification
        let serviceName = "الخدمة المطلوبة";
        let serviceImage = null;

        if (user.lastSearch.subService) {
          const subService = await SubService.findById(
            user.lastSearch.subService,
          ).populate("service");
          serviceName = subService?.arabicName || subService?.name || serviceName;
          serviceImage = subService?.service?.icon;
        } else if (user.lastSearch.service) {
          const Service = require("../models/Service");
          const service = await Service.findById(user.lastSearch.service);
          serviceName = service?.name || serviceName;
          serviceImage = service?.icon;
        }

        // Send FCM notification
        const title = "خبراء متاحين في منطقتك! 🔧";
        const body = `وجدنا لك ${experts.length} خبراء متخصصين في ${serviceName}. اضغط لمشاهدة التفاصيل.`;
        const data = {
          type: "expert_suggestions",
          serviceId: user.lastSearch.service?.toString() || "",
          subServiceId: user.lastSearch.subService?.toString() || "",
          expertIds: JSON.stringify(experts.map((e) => e._id.toString())),
        };

        await sendNotification(user.fcmToken, title, body, serviceImage, data, user._id);

        // Update lastSuggestionSentAt
        await User.findByIdAndUpdate(user._id, {
          lastSuggestionSentAt: now,
        });

        console.log(`Sent suggestion notification to user ${user._id}`);
      } catch (userError) {
        console.error(`Error processing user ${user._id}:`, userError);
      }
    }

    console.log("Expert suggestions cron job completed");
  } catch (error) {
    console.error("Error in expert suggestions cron job:", error);
  }
};

module.exports = sendExpertSuggestions;
