import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Front et API sur la même origine (/api relayé par le front) : pas de CORS.
  // Le relais du front recopie les en-têtes sans s'ajouter : `req.ip` = dernière adresse de X-Forwarded-For, posée par
  // le reverse proxy HTTPS (le vrai client, pour @RateLimit) ; en dev, sans reverse proxy, l'adresse du front.
  app.set('trust proxy', 1);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
