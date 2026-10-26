"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = require("./cors");
describe('CORS origin policy', () => {
    it('parses and normalizes comma-separated configured origins', () => {
        expect((0, cors_1.getAllowedOrigins)(' https://app.example.com/ , https://admin.example.com ')).toEqual([
            'https://app.example.com',
            'https://admin.example.com',
            'https://rad-cucurucho-a9ef22.netlify.app',
        ]);
    });
    it('allows configured origins in production and rejects unknown origins', () => {
        const allowedOrigins = (0, cors_1.getAllowedOrigins)('https://app.example.com');
        expect((0, cors_1.isCorsOriginAllowed)('https://app.example.com', allowedOrigins, 'production')).toBe(true);
        expect((0, cors_1.isCorsOriginAllowed)('https://random-site.netlify.app', allowedOrigins, 'production')).toBe(false);
    });
    it('allows requests without an Origin header and all origins outside production', () => {
        const allowedOrigins = (0, cors_1.getAllowedOrigins)('https://app.example.com');
        expect((0, cors_1.isCorsOriginAllowed)(undefined, allowedOrigins, 'production')).toBe(true);
        expect((0, cors_1.isCorsOriginAllowed)('https://random.example.com', allowedOrigins, 'development')).toBe(true);
    });
});
//# sourceMappingURL=cors.spec.js.map