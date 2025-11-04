const cron = require('node-cron');
const findOldContactRequests = require('../tasks/findOldContactRequests');

const initScheduledJobs = () => {
  // Schedule to run every 30 minutes
  cron.schedule('*/30 * * * *', findOldContactRequests);

  // Schedule other tasks here
  // cron.schedule('0 * * * *', someOtherTask);
};

module.exports = initScheduledJobs;
