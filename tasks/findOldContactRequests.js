const ContactRequest = require('../models/ContactRequest');

const findOldContactRequests = async () => {
  console.log('Running cron job to find old contact requests...');
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const oldContactRequests = await ContactRequest.find({
      createdAt: { $lt: fifteenMinutesAgo },
      status: "initiated"
    });

    if (oldContactRequests.length > 0) {
      console.log(`Found ${oldContactRequests.length} contact requests older than 15 minutes:`);
      oldContactRequests.forEach(request => console.log(request._id));
    } else {
      console.log('No contact requests older than 15 minutes found.');
    }
  } catch (error) {
    console.error('Error in cron job for contact requests:', error);
  }
};

module.exports = findOldContactRequests;
