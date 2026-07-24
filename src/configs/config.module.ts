import type { ConfigModuleOptions } from '@nestjs/config';

import { configValidationSchema } from './config.schema';
import { ENV_VALUES } from './constants';

export function getConfigModuleOptions(): ConfigModuleOptions {
  const requestedNodeEnv = process.env.NODE_ENV?.trim() || ENV_VALUES.DEFAULT_VALUES.NODE_ENV;
  const supportedNodeEnvironments: readonly string[] = Object.values(ENV_VALUES.NODE_ENVIRONMENTS);
  // Never interpolate an unvalidated environment value into a filesystem path.
  const envFileSuffix = supportedNodeEnvironments.includes(requestedNodeEnv)
    ? requestedNodeEnv
    : ENV_VALUES.DEFAULT_VALUES.NODE_ENV;

  return {
    isGlobal: true,
    validationSchema: configValidationSchema,
    // A local override stays untracked and takes precedence over the shared environment file.
    envFilePath: [`envs/.env.${envFileSuffix}.local`, `envs/.env.${envFileSuffix}`],
    cache: true,
    expandVariables: true,
    validationOptions: {
      abortEarly: false,
      allowUnknown: true,
    },
  };
}
