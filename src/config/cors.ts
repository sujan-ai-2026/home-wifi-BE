export const DEFAULT_PRODUCTION_FRONTEND_ORIGIN =
  'https://rad-cucurucho-a9ef22.netlify.app';

export function getAllowedOrigins(frontendOrigins?: string): string[] {
  const origins = frontendOrigins
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return [...new Set([...(origins ?? []), DEFAULT_PRODUCTION_FRONTEND_ORIGIN])];
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  nodeEnv: string,
): boolean {
  if (!origin || nodeEnv !== 'production') {
    return true;
  }

  return allowedOrigins.includes(origin.replace(/\/+$/, ''));
}
