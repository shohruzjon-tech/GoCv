export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-builder',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'jwt-secret-dev',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:4000/api/auth/google/callback',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'cv-builder-uploads',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@cvbuilder.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
});
