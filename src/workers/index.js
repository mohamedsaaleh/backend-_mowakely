const logger = require('../utils/logger');

const setupEmailWorker = (jobQueue) => {
  const emailQueue = jobQueue.getQueue('email');

  emailQueue.process(async (job) => {
    const { type, email, ...data } = job.data;

    logger.info(`Processing email job: ${type}`, { email });

    switch (type) {
      case 'verification':
        await sendVerificationEmail(email, data.token);
        break;
      case 'password-reset':
        await sendPasswordResetEmail(email, data.token);
        break;
      case 'welcome':
        await sendWelcomeEmail(email, data.name);
        break;
      case 'offer-accepted':
        await sendOfferAcceptedEmail(email, data.caseTitle);
        break;
      case 'case-update':
        await sendCaseUpdateEmail(email, data.caseTitle, data.status);
        break;
      case 'payment-received':
        await sendPaymentReceivedEmail(email, data.amount, data.caseTitle);
        break;
      default:
        logger.warn(`Unknown email type: ${type}`);
    }

    return { success: true, type, email };
  });

  logger.info('Email worker initialized');
};

const setupNotificationWorker = (jobQueue) => {
  const notificationQueue = jobQueue.getQueue('notification');

  notificationQueue.process(async (job) => {
    const { type, userId, ...data } = job.data;

    logger.info(`Processing notification job: ${type}`, { userId });

    return { success: true, type, userId };
  });

  logger.info('Notification worker initialized');
};

const setupCleanupWorker = (jobQueue) => {
  const cleanupQueue = jobQueue.getQueue('cleanup');

  cleanupQueue.process(async (job) => {
    const { type } = job.data;

    logger.info(`Processing cleanup job: ${type}`);

    switch (type) {
      case 'expired-tokens':
        await cleanupExpiredTokens();
        break;
      case 'old-notifications':
        await cleanupOldNotifications();
        break;
      case 'inactive-sessions':
        await cleanupInactiveSessions();
        break;
      default:
        logger.warn(`Unknown cleanup type: ${type}`);
    }

    return { success: true, type };
  });

  logger.info('Cleanup worker initialized');
};

async function sendVerificationEmail(email, token) {
  logger.info(`Sending verification email to ${email}`);
  console.log(`[MOCK EMAIL] Verification link: https://app.com/verify?token=${token}`);
}

async function sendPasswordResetEmail(email, token) {
  logger.info(`Sending password reset email to ${email}`);
  console.log(`[MOCK EMAIL] Reset link: https://app.com/reset-password?token=${token}`);
}

async function sendWelcomeEmail(email, name) {
  logger.info(`Sending welcome email to ${email}`);
  console.log(`[MOCK EMAIL] Welcome ${name}!`);
}

async function sendOfferAcceptedEmail(email, caseTitle) {
  logger.info(`Sending offer accepted email to ${email}`);
  console.log(`[MOCK EMAIL] Your offer on case "${caseTitle}" was accepted!`);
}

async function sendCaseUpdateEmail(email, caseTitle, status) {
  logger.info(`Sending case update email to ${email}`);
  console.log(`[MOCK EMAIL] Case "${caseTitle}" status: ${status}`);
}

async function sendPaymentReceivedEmail(email, amount, caseTitle) {
  logger.info(`Sending payment received email to ${email}`);
  console.log(`[MOCK EMAIL] Payment of $${amount} received for case "${caseTitle}"`);
}

async function cleanupExpiredTokens() {
  logger.info('Cleaning up expired tokens...');
}

async function cleanupOldNotifications() {
  logger.info('Cleaning up old notifications...');
}

async function cleanupInactiveSessions() {
  logger.info('Cleaning up inactive sessions...');
}

if (require.main === module) {
  const { jobQueue } = require('../utils/jobQueue');
  
  setupEmailWorker(jobQueue);
  setupNotificationWorker(jobQueue);
  setupCleanupWorker(jobQueue);

  logger.info('All workers started');
}

module.exports = {
  setupEmailWorker,
  setupNotificationWorker,
  setupCleanupWorker
};