const Queue = require('bull');
const config = require('../config/env');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class JobQueue {
  constructor() {
    this.queues = {};
    this.initialize();
  }

  initialize() {
    this.queues.email = new Queue('email', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    this.queues.notification = new Queue('notification', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false
      }
    });

    this.queues.cleanup = new Queue('cleanup', redisUrl, {
      defaultJobOptions: {
        removeOnComplete: true
      }
    });

    this.queues.reminder = new Queue('reminder', redisUrl, {
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true
      }
    });

    this.setupEvents();
  }

  setupEvents() {
    Object.keys(this.queues).forEach(name => {
      const queue = this.queues[name];

      queue.on('completed', (job, result) => {
        logger.info(`Job ${name}:${job.id} completed`, { result });
      });

      queue.on('failed', (job, err) => {
        logger.error(`Job ${name}:${job.id} failed`, { error: err.message });
      });

      queue.on('error', (error) => {
        logger.error(`Queue ${name} error:`, { error: error.message });
      });
    });
  }

  async addEmailJob(type, data) {
    return this.queues.email.add({ type, ...data }, {
      priority: data.priority || 2,
      delay: data.delay || 0
    });
  }

  async addNotificationJob(type, userId, data) {
    return this.queues.notification.add({ type, userId, ...data });
  }

  async addCleanupJob(type, data) {
    return this.queues.cleanup.add({ type, ...data });
  }

  async addReminderJob(type, data, delay) {
    return this.queues.reminder.add({ type, ...data }, { delay });
  }

  getQueue(name) {
    return this.queues[name];
  }

  async getJobCounts(name) {
    return this.queues[name].getJobCounts();
  }

  async close() {
    for (const queue of Object.values(this.queues)) {
      await queue.close();
    }
  }
}

const jobQueue = new JobQueue();

const emailJobs = {
  sendVerification: (email, token) => jobQueue.addEmailJob('verification', { email, token }),
  sendPasswordReset: (email, token) => jobQueue.addEmailJob('password-reset', { email, token }),
  sendWelcome: (email, name) => jobQueue.addEmailJob('welcome', { email, name }),
  sendOfferAccepted: (email, caseTitle) => jobQueue.addEmailJob('offer-accepted', { email, caseTitle }),
  sendCaseUpdate: (email, caseTitle, status) => jobQueue.addEmailJob('case-update', { email, caseTitle, status }),
  sendPaymentReceived: (email, amount, caseTitle) => jobQueue.addEmailJob('payment-received', { email, amount, caseTitle })
};

const notificationJobs = {
  sendToUser: (userId, type, data) => jobQueue.addNotificationJob(type, userId, data),
  sendCaseNotification: (userId, caseId, message) => jobQueue.addNotificationJob('case', userId, { caseId, message }),
  sendOfferNotification: (userId, offerId, message) => jobQueue.addNotificationJob('offer', userId, { offerId, message })
};

const cleanupJobs = {
  cleanupExpiredTokens: () => jobQueue.addCleanupJob('expired-tokens', {}),
  cleanupOldNotifications: () => jobQueue.addCleanupJob('old-notifications', {}),
  cleanupInactiveSessions: () => jobQueue.addCleanupJob('inactive-sessions', {})
};

const reminderJobs = {
  caseDeadlineReminder: (userId, caseId, deadline) => {
    const delay = new Date(deadline).getTime() - Date.now() - 24 * 60 * 60 * 1000;
    if (delay > 0) {
      jobQueue.addReminderJob('case-deadline', { userId, caseId }, delay);
    }
  }
};

module.exports = {
  jobQueue,
  emailJobs,
  notificationJobs,
  cleanupJobs,
  reminderJobs
};