import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Get CORS origins from config (can be comma-separated)
      const corsOrigin = configService.get('cors.origin') || '';
      const allowedOrigins = corsOrigin
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      // Allow Chrome extension origins (they start with chrome-extension://)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin?.startsWith('chrome-extension://')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition'], // Expose Content-Disposition header for PDF downloads
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // Allow nested objects for profiles
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') ?? 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
}
void bootstrap();
