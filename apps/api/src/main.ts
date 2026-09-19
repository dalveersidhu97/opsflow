import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {
  configureApp,
  configureOpenApi,
} from './app.setup.js';

async function bootstrap(): Promise<void> {
  const app =
    await NestFactory.create(AppModule);

  configureApp(app);
  configureOpenApi(app);

  await app.listen(
    process.env.PORT ?? 3000,
  );
}

void bootstrap();