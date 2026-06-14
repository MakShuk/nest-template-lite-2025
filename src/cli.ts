import { CommandFactory } from 'nest-commander';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  await CommandFactory.run(AppModule);
}

bootstrap().catch(error => {
  process.stderr.write(`Failed to run CLI: ${error instanceof Error ? error.stack : error}\n`);
  process.exit(1);
});
