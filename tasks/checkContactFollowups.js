const ContactRequest = require("../models/ContactRequest");
const { sendNotification } = require("../utils/sendNotification");

const checkContactFollowups = async () => {
  console.log("Running contact follow-up check...");

  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Find contacts created > 15 mins ago where we haven't asked the expert yet
    const contacts = await ContactRequest.find({
      createdAt: { $lte: fifteenMinutesAgo },
      expertCheckSentAt: { $exists: false },
      status: "initiated", // Only check initiated contacts
    }).populate("expert", "fcmToken name");


    console.log(`Found ${contacts.length} contacts needing expert follow-up`);

    for (const contact of contacts) {
      try {
        if (!contact.expert) {
          console.log(`Skipping contact ${contact._id}: No expert`);
          continue;
        }

        // Send FCM to Expert
        const title = "متابعة الطلب 📋";
        const body = "هل تم الاتفاق مع العميل؟";
        const data = {
          type: "expert_followup",
          contactId: contact._id.toString(),
          action: "confirm_deal",
        };

        await sendNotification(
          contact.expert.fcmToken,
          title,
          body,
          null,
          data,
          contact.expert._id
        );

        // Update contact to mark check as sent
        contact.expertCheckSentAt = new Date();
        await contact.save();

        console.log(`Sent follow-up to expert for contact ${contact._id}`);
      } catch (err) {
        console.error(`Error processing contact ${contact._id}:`, err);
      }
    }
  } catch (error) {
    console.error("Error in checkContactFollowups:", error);
  }
};

module.exports = checkContactFollowups;
