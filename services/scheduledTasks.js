const cron = require("node-cron");
const sendExpertSuggestions = require("../tasks/sendExpertSuggestions");

const checkContactFollowups = require("../tasks/checkContactFollowups");
const checkReviewRequests = require("../tasks/checkReviewRequests");

const initScheduledJobs = () => {

  // Schedule expert suggestions to run every hour
  cron.schedule("0 * * * *", sendExpertSuggestions);

  // Schedule contact follow-up checks to run every minute
  cron.schedule("* * * * *", checkContactFollowups);

  // Schedule review requests to run every hour
  cron.schedule("0 * * * *", checkReviewRequests);

  console.log("Scheduled jobs initialized");
};

module.exports = initScheduledJobs;
