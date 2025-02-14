import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('PocketSync API')
  .setDescription('API documentation for PocketSync backend services')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token for OAuth authentication',
      in: 'header',
    },
    'oauth-token',
  )
  .addApiKey(
    {
      type: 'apiKey',
      name: 'x-project-id',
      in: 'header',
      description: 'Project ID for SDK authentication',
    },
    'sdk-token',
  )
  .build();