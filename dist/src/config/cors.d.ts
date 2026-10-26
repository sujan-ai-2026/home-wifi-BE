export declare const DEFAULT_PRODUCTION_FRONTEND_ORIGIN = "https://rad-cucurucho-a9ef22.netlify.app";
export declare function getAllowedOrigins(frontendOrigins?: string): string[];
export declare function isCorsOriginAllowed(origin: string | undefined, allowedOrigins: string[], nodeEnv: string): boolean;
