const ContactRequest = require("../models/ContactRequest");
const notificationUtils = require("../utils/sendNotification");

const checkReviewRequests = async () => {
    console.log("Running review request check...");

    try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Find confirmed contacts where dealDate is more than 24 hours ago and we haven't asked for a review yet
        const contacts = await ContactRequest.find({
            status: "confirmed",
            dealDate: { $lt: oneDayAgo },
            customerReviewRequested: { $ne: true },
        }).populate("customer", "fcmToken name").populate("expert", "name");

        console.log(`Found ${contacts.length} contacts needing review request`);

        for (const contact of contacts) {
            try {
                if (!contact.customer) {
                    console.log(`Skipping contact ${contact._id}: No customer`);
                    continue;
                }

                // Send FCM to Customer
                const title = "كيف كانت خدمتك؟ ⭐";
                const body = `نرجو تقييم الخبير ${contact.expert.name} لمساعدتنا في تحسين الخدمة.`;
                const data = {
                    type: "review_request",
                    contactId: contact._id.toString(),
                    expertId: contact.expert._id.toString(),
                    action: "rate_expert",
                };

                await notificationUtils.sendNotification(
                    contact.customer.fcmToken,
                    title,
                    body,
                    undefined,
                    data,
                    contact.customer._id
                );

                // Update contact to mark review request as sent
                contact.customerReviewRequested = true;
                await contact.save();

                console.log(`Sent review request to customer for contact ${contact._id}`);
            } catch (err) {
                console.error(`Error processing contact ${contact._id}:`, err);
            }
        }
    } catch (error) {
        console.error("Error in checkReviewRequests:", error);
    }
};

module.exports = checkReviewRequests;
