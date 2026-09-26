import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('DentalSuiteBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown hooks for cloud containers (Fly.io SIGTERM / SIGINT)
  app.enableShutdownHooks();

  // Production payload size configuration for intraoral photography & scans
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  // Corporate security headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Configure CORS for clinical web frontends and operatory tablets
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Validation Pipe with strict DTO sanitation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI documentation
  const isProd = process.env.NODE_ENV === 'production';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || !isProd;

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DentalSuite Clinical REST API')
      .setDescription(
        'Corporate-grade dentistry backend featuring JWT authentication (15m access / 7d rotating refresh tokens), Supabase PostgreSQL TypeORM integration, 32-tooth odontogram clinical state, appointment scheduling, inventory management, and real-time WebSockets.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter 15-minute access token (obtained via /api/v1/auth/login)',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentication and token rotation')
      .addTag('patients', 'Patient chart management')
      .addTag('odontogram', '32-tooth universal odontogram records')
      .addTag('appointments', 'Clinic schedule, conflict detection & throughput')
      .addTag('treatments', 'Clinical procedure logs and consumable stock deduction')
      .addTag('admin', 'Operatory chairs, staff shifts, and inventory catalog')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'DentalSuite API Documentation',
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`====================================================`);
  logger.log(`🦷 DentalSuite Clinical REST API started successfully!`);
  logger.log(`🚀 Server listening on: http://0.0.0.0:${port}`);
  if (enableSwagger) {
    logger.log(`📄 Swagger OpenAPI docs: http://0.0.0.0:${port}/api/docs`);
  }
  logger.log(`🏥 Healthcheck endpoint: http://0.0.0.0:${port}/api/v1/health`);
  logger.log(`====================================================`);
}

bootstrap();
