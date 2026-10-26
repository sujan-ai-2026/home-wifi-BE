import { getAllowedOrigins, isCorsOriginAllowed } from './cors';

describe('CORS origin policy', () => {
  it('parses and normalizes comma-separated configured origins', () => {
    expect(
      getAllowedOrigins(
        ' https://app.example.com/ , https://admin.example.com ',
      ),
    ).toEqual([
      'https://app.example.com',
      'https://admin.example.com',
      'https://rad-cucurucho-a9ef22.netlify.app',
    ]);
  });

  it('allows configured origins in production and rejects unknown origins', () => {
    const allowedOrigins = getAllowedOrigins('https://app.example.com');

    expect(
      isCorsOriginAllowed(
        'https://app.example.com',
        allowedOrigins,
        'production',
      ),
    ).toBe(true);
    expect(
      isCorsOriginAllowed(
        'https://random-site.netlify.app',
        allowedOrigins,
        'production',
      ),
    ).toBe(false);
  });

  it('allows requests without an Origin header and all origins outside production', () => {
    const allowedOrigins = getAllowedOrigins('https://app.example.com');

    expect(isCorsOriginAllowed(undefined, allowedOrigins, 'production')).toBe(
      true,
    );
    expect(
      isCorsOriginAllowed(
        'https://random.example.com',
        allowedOrigins,
        'development',
      ),
    ).toBe(true);
  });
});
