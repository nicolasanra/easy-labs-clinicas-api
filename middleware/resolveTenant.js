/**
 * middleware/resolveTenant.js
 * Express middleware to resolve tenant identifier from request.
 * Tries X-Tenant-Id header, query param `tenant`, then subdomain (foo.example.com -> foo).
 * If no tenant found, uses options.defaultTenant if provided, otherwise returns 400 error.
 */

function resolveTenant(options = {}) {
  return function (req, res, next) {
    try {
      // 1. Header
      const headerTenant = req.headers['x-tenant-id'] || req.get && req.get('x-tenant-id');
      // 2. Query param
      let tenant = headerTenant || (req.query && req.query.tenant) || null;

      // 3. Subdomain (host)
      if (!tenant && req.headers && req.headers.host) {
        const host = req.headers.host.split(':')[0]; // remove port
        const parts = host.split('.');
        // assume subdomain exists when there are more than 2 parts
        if (parts.length > 2 && parts[0] !== 'www') {
          tenant = parts[0];
        }
      }

      // 4. Default fallback
      if (!tenant && options.defaultTenant) {
        tenant = options.defaultTenant;
      }

      if (!tenant) {
        const err = new Error('Tenant no resuelto');
        err.status = 400; // Bad Request
        return next(err);
      }

      // attach to request for downstream handlers
      req.tenantId = tenant;

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = resolveTenant;