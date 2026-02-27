export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

export enum JobType {
  AI_CV_GENERATE = 'ai.cv.generate',
  AI_CV_ENHANCE = 'ai.cv.enhance',
  AI_CV_TAILOR = 'ai.cv.tailor',
  AI_CV_HTML = 'ai.cv.html',
  AI_BULLETS = 'ai.bullets',
  AI_SUMMARY = 'ai.summary',
  AI_ATS_SCORE = 'ai.ats_score',
  AI_SKILL_GAP = 'ai.skill_gap',
  AI_INTERVIEW_PREP = 'ai.interview_prep',
  PDF_GENERATE = 'pdf.generate',
  PDF_BULK_EXPORT = 'pdf.bulk_export',
  EMAIL_SEND = 'email.send',
  WEBHOOK_DISPATCH = 'webhook.dispatch',
  DATA_EXPORT = 'data.export',
  ORG_BULK_IMPORT = 'org.bulk_import',
}

export enum QueueName {
  AI_PROCESSING = 'ai-processing',
  PDF_GENERATION = 'pdf-generation',
  NOTIFICATIONS = 'notifications',
  WEBHOOKS = 'webhooks',
  DATA_PIPELINE = 'data-pipeline',
}
