// Simple in-memory cache for frequently accessed data
// For production, use Redis instead
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute default

const getCacheKey = (prefix, key) => `${prefix}:${key}`;

const cacheMiddleware = (ttl = CACHE_TTL) => {
  return (req, res, next) => {
    const key = getCacheKey(req.path, JSON.stringify(req.query));
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiry) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to cache response
    res.json = function(data) {
      cache.set(key, {
        data,
        expiry: Date.now() + ttl,
      });
      
      // Clean up old cache entries periodically
      if (cache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (now >= v.expiry) {
            cache.delete(k);
          }
        }
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

const clearCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

module.exports = { cacheMiddleware, clearCache, cache };
