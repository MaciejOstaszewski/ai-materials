import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Option 1: Quick enable for all origins
  app.enableCors();
  // or more restrictively
  // app.enableCors({ origin: 'https://your-frontend-domain' });

  // Start the app
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
