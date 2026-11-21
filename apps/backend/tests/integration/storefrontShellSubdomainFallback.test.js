const {
  isPublicStorefrontShellRequest,
  isTenantStorefrontHost,
} = require('../../middleware/globalSecurity');
const { inferSubdomainSlug } = require('../../middleware/subdomainMiddleware');

describe('Storefront shell subdomain fallback', () => {
  test('treats storefront shell requests on custom domains (e.g. hawazin.shop) as public for thank-you page', () => {
    const req = {
      method: 'GET',
      originalUrl: '/thank-you?orderId=ORD-734149-682',
      path: '/thank-you',
      headers: {
        host: 'hawazin.shop',
        'x-subdomain': 'hawazin.shop',
      },
    };

    expect(isPublicStorefrontShellRequest(req)).toBe(true);
  });

  test('treats storefront shell requests on www custom domains as public', () => {
    const req = {
      method: 'GET',
      originalUrl: '/thank-you?orderId=ORD-734149-682',
      path: '/thank-you',
      headers: {
        host: 'www.hawazin.shop',
      },
    };

    expect(isPublicStorefrontShellRequest(req)).toBe(true);
  });

  test('isTenantStorefrontHost correctly classifies custom domains, platform domains, and infra subdomains', () => {
    // Custom domains
    expect(isTenantStorefrontHost('hawazin.shop', 'maxp.online')).toBe(true);
    expect(isTenantStorefrontHost('www.hawazin.shop', 'maxp.online')).toBe(true);
    expect(isTenantStorefrontHost('store.mybrand.com', 'maxp.online')).toBe(true);

    // Platform tenant subdomains
    expect(isTenantStorefrontHost('swan.maxp.online', 'maxp.online')).toBe(true);
    expect(isTenantStorefrontHost('www.swan.maxp.online', 'maxp.online')).toBe(true);
    expect(isTenantStorefrontHost('swan.mokhtarelhenawy.online', 'maxp.online')).toBe(true);

    // Platform apex & reserved infra subdomains (must NOT be treated as tenant storefronts)
    expect(isTenantStorefrontHost('maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('www.maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('app.maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('admin.maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('api.maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('dashboard.maxp.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('mokhtarelhenawy.online', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('www.mokhtarelhenawy.online', 'maxp.online')).toBe(false);

    // Local hostnames without tenant subdomain
    expect(isTenantStorefrontHost('localhost', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('127.0.0.1', 'maxp.online')).toBe(false);
    expect(isTenantStorefrontHost('app.localhost', 'maxp.online')).toBe(false);

    // Local dev tenant subdomains
    expect(isTenantStorefrontHost('swan.localhost', 'maxp.online')).toBe(true);
    expect(isTenantStorefrontHost('swan.lvh.me', 'maxp.online')).toBe(true);
  });

  test('treats storefront shell requests on tenant-style hosts as public even without MAIN_DOMAIN', () => {
    const originalMainDomain = process.env.MAIN_DOMAIN;
    delete process.env.MAIN_DOMAIN;

    const req = {
      method: 'GET',
      originalUrl: '/shop',
      path: '/shop',
      headers: {
        host: 'swan.tenant-example.com',
        'x-subdomain': 'swan.tenant-example.com',
      },
    };

    expect(isPublicStorefrontShellRequest(req)).toBe(true);

    if (originalMainDomain === undefined) {
      delete process.env.MAIN_DOMAIN;
    } else {
      process.env.MAIN_DOMAIN = originalMainDomain;
    }
  });

  test('treats HEAD storefront shell requests on tenant-style hosts as public', () => {
    const req = {
      method: 'HEAD',
      originalUrl: '/shop',
      path: '/shop',
      headers: {
        host: 'swan.maxp.online',
        'x-subdomain': 'swan.maxp.online',
      },
    };

    expect(isPublicStorefrontShellRequest(req)).toBe(true);
  });

  test('infers the slug from tenant-style hosts when MAIN_DOMAIN is unset', () => {
    expect(inferSubdomainSlug('swan.tenant-example.com', undefined)).toBe('swan');
    expect(inferSubdomainSlug('www.tenant-example.com', undefined)).toBeNull();
    expect(inferSubdomainSlug('tenant-example.com', undefined)).toBeNull();
  });

  test('infers the slug from local dev wildcard hosts', () => {
    expect(inferSubdomainSlug('maxp.lvh.me', 'mokhtarelhenawy.online')).toBe('maxp');
    expect(inferSubdomainSlug('maxp.localhost', 'mokhtarelhenawy.online')).toBe('maxp');
  });
});
