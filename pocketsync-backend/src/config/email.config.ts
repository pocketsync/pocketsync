import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@pocketsync.dev',
}));