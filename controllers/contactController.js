const User = require("../models/User");
const ContactRequest = require("../models/ContactRequest");

// Get expert contact and create contact request
const getExpertContact = async (req, res) => {
  const { serviceId, lat, long } = req.query;
  const customerId = req.user.id;
  const expertId = req.params.expertId;

  try {
    // 1. Get expert contact information
    const expert = await User.findById(expertId).select("name phone email");

    if (!expert || expert.role !== "expert") {
      return res.status(404).json({ message: "Expert not found" });
    }

    // 2. Create contact request
    let location = undefined;
    if (lat && long) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(long);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        location = {
          type: "Point",
          coordinates: [longitude, latitude],
        };
      }
    }

    const contactRequest = new ContactRequest({
      customer: customerId,
      expert: expertId,
      service: serviceId,
      location,
    });

    await contactRequest.save();

    res.status(200).json({
      message:
        "Expert contact retrieved and contact request created successfully",
      expert: expert,
      contactRequest: contactRequest,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

module.exports = {
  getExpertContact,
};
