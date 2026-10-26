"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRODUCTION_FRONTEND_ORIGIN = void 0;
exports.getAllowedOrigins = getAllowedOrigins;
exports.isCorsOriginAllowed = isCorsOriginAllowed;
exports.DEFAULT_PRODUCTION_FRONTEND_ORIGIN = 'https://rad-cucurucho-a9ef22.netlify.app';
function getAllowedOrigins(frontendOrigins) {
    const origins = frontendOrigins
        ?.split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    return [...new Set([...(origins ?? []), exports.DEFAULT_PRODUCTION_FRONTEND_ORIGIN])];
}
function isCorsOriginAllowed(origin, allowedOrigins, nodeEnv) {
    if (!origin || nodeEnv !== 'production') {
        return true;
    }
    return allowedOrigins.includes(origin.replace(/\/+$/, ''));
}
//# sourceMappingURL=cors.js.map