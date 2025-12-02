const User = require("../models/User");
const ContactRequest = require("../models/ContactRequest");
const Notification = require("../models/Notification");

// Get expert contact and create contact request
const getExpertContact = async (req, res) => {
  const { subServiceId, lat, long } = req.query;
  const customerId = req.user.id;
  const expertId = req.params.expertId;

  try {
    const expert = await User.findById(expertId).select("name phone whatsapp email role");

    if (!expert) {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (expert.role !== "expert") {
      return res.status(400).json({ message: "User is not an expert" });
    }

    const location = parseLocation(lat, long);

    const contactRequest = await ContactRequest.create({
      customer: customerId,
      expert: expertId,
      service: subServiceId,
      location,
    });

    // Disable suggestions after user creates a contact request
    try {
      await User.findByIdAndUpdate(customerId, {
        lastSearch: null,
      });
    } catch (updateError) {
      // Log error but don't fail the request
      console.error("Error disabling suggestions:", updateError);
    }

    return res.status(200).json({
      message: "Expert contact retrieved and contact request created successfully",
      expert: {
        id: expert._id,
        name: expert.name,
        phone: expert.phone,
        email: expert.email,
        whatsappLink: expert.whatsapp
          ? `https://wa.me/${expert.whatsapp.replace("+", "")}?text=${encodeURIComponent(
            "مرحباً، لقد وجدتك على تطبيق ساعتها وأرغب في التواصل معك بخصوص خدمتك.",
          )}`
          : null,
      },
      contactRequest: {
        id: contactRequest._id,
        subService: contactRequest.service,
        location: contactRequest.location,
        createdAt: contactRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in getExpertContact:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Helper function to parse location coordinates
const parseLocation = (lat, long) => {
  if (!lat || !long) {
    return undefined;
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(long);

  if (isNaN(latitude) || isNaN(longitude)) {
    return undefined;
  }

  // Validate coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
};

// Handle Expert Response (Deal / No Deal)
const handleExpertResponse = async (req, res) => {
  const { id } = req.params;
  const { hasDeal } = req.body; // boolean
  const expertId = req.user.id;

  try {
    const contact = await ContactRequest.findById(id).populate("customer", "fcmToken name").populate("expert", "name");

    if (!contact) {
      return res.status(404).json({ message: "Contact request not found" });
    }

    if (contact.expert._id.toString() !== expertId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    contact.expertResponse = hasDeal;
    contact.expertResponseAt = new Date();
    await contact.save();

    // Notify Customer
    if (contact.customer) {
      let title, body, data;

      if (hasDeal) {
        title = "تأكيد الاتفاق ✅";
        body = `أكد الخبير ${contact.expert.name} الاتفاق. متى موعد التنفيذ؟`;
        data = {
          type: "customer_followup",
          contactId: contact._id.toString(),
          action: "provide_date",
        };
      } else {
        title = "متابعة الطلب ❓";
        body = `أفاد الخبير ${contact.expert.name} بعدم الاتفاق. هل هذا صحيح؟`;
        data = {
          type: "customer_followup",
          contactId: contact._id.toString(),
          action: "confirm_no_deal",
        };
      }

      await require("../utils/sendNotification").sendNotification(
        contact.customer.fcmToken,
        title,
        body,
        null,
        data,
        contact.customer._id
      );
    }

    // Delete the expert_followup notification
    await Notification.deleteOne({
      recipient: expertId,
      "data.contactId": contact._id.toString(),
      "data.type": "expert_followup",
    });

    return res.status(200).json({ message: "Response recorded successfully" });
  } catch (error) {
    console.error("Error in handleExpertResponse:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Handle Customer Response
const handleCustomerResponse = async (req, res) => {
  const { id } = req.params;
  const { dealDate, confirmNoDeal } = req.body;
  const customerId = req.user.id;

  try {
    const contact = await ContactRequest.findById(id);

    if (!contact) {
      return res.status(404).json({ message: "Contact request not found" });
    }

    if (contact.customer.toString() !== customerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    contact.customerResponseAt = new Date();

    if (dealDate) {
      contact.dealDate = new Date(dealDate);
      contact.status = "confirmed";
      await contact.save();

      await Notification.deleteOne({
        recipient: customerId,
        "data.contactId": contact._id.toString(),
        "data.type": "customer_followup",
      });

      return res.status(200).json({ message: "Deal date confirmed" });
    } else if (confirmNoDeal) {
      contact.customerConfirmedNoDeal = true;
      contact.status = "denied";
      await contact.save();

      await Notification.deleteOne({
        recipient: customerId,
        "data.contactId": contact._id.toString(),
        "data.type": "customer_followup",
      });

      return res.status(200).json({
        message: "No deal confirmed. We will send you new suggestions shortly."
      });
    }

    return res.status(400).json({ message: "Invalid response data" });
  } catch (error) {
    console.error("Error in handleCustomerResponse:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Review Expert
const reviewExpert = async (req, res) => {
  const { id } = req.params; // ContactRequest ID
  const { rating, comment } = req.body;
  const customerId = req.user.id;

  try {
    const contact = await ContactRequest.findById(id);

    if (!contact) {
      return res.status(404).json({ message: "Contact request not found" });
    }

    // Verify ownership
    if (contact.customer.toString() !== customerId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Verify status
    if (contact.status !== "confirmed") {
      return res.status(400).json({ message: "Can only review confirmed contacts" });
    }

    // Verify not already reviewed
    if (contact.isReviewed) {
      return res.status(400).json({ message: "You have already reviewed this expert for this service" });
    }

    // Create Review
    const Review = require("../models/Review");
    await Review.create({
      customer: customerId,
      expert: contact.expert,
      contactRequest: contact._id,
      rating,
      comment,
    });

    // Update ContactRequest
    contact.isReviewed = true;
    await contact.save();

    // Update Expert Rating
    const expert = await User.findById(contact.expert);
    const currentRating = expert.expertProfile.averageRating || 0;
    const currentCount = expert.expertProfile.ratingCount || 0;

    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    expert.expertProfile.averageRating = newRating;
    expert.expertProfile.ratingCount = newCount;
    await expert.save();

    // Delete the review_request notification
    await Notification.deleteOne({
      recipient: customerId,
      "data.contactId": contact._id.toString(),
      "data.type": "review_request",
    });

    return res.status(201).json({ message: "Review submitted successfully" });

  } catch (error) {
    console.error("Error in reviewExpert:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getExpertContact,
  handleExpertResponse,
  handleCustomerResponse,
  reviewExpert,
};
