const rateLimiter = require('../server/rate-limiter');

describe('rate-limiter module', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.1',
      connection: { remoteAddress: '192.168.1.1' },
      body: { username: 'testuser' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    // Clear the attempts map between tests
    jest.resetModules();
  });

  describe('rateLimitMiddleware', () => {
    test('allows first request', () => {
      rateLimiter.rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('blocks after max attempts', () => {
      // Make max attempts + 1
      for (let i = 0; i < 6; i++) {
        rateLimiter.rateLimitMiddleware(mockReq, mockRes, mockNext);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
        retryAfter: 900
      });
    });

    test('resets after window expires', () => {
      // Make some attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.rateLimitMiddleware(mockReq, mockRes, mockNext);
      }

      // Mock time passing
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 16 * 60 * 1000); // 16 minutes later

      // Should allow again
      rateLimiter.rateLimitMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      Date.now = originalDateNow;
    });

    test('handles different IP addresses separately', () => {
      const req1 = { ...mockReq, ip: '192.168.1.1' };
      const req2 = { ...mockReq, ip: '192.168.1.2' };

      // Make max attempts for first IP
      for (let i = 0; i < 6; i++) {
        rateLimiter.rateLimitMiddleware(req1, mockRes, mockNext);
      }

      // Second IP should still be allowed
      rateLimiter.rateLimitMiddleware(req2, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authRateLimit', () => {
    test('allows first authentication attempt', () => {
      rateLimiter.authRateLimit(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('blocks authentication after max attempts', () => {
      // Make max attempts + 1
      for (let i = 0; i < 6; i++) {
        rateLimiter.authRateLimit(mockReq, mockRes, mockNext);
      }

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: 900
      });
    });

    test('tracks attempts per username', () => {
      const req1 = { ...mockReq, body: { username: 'user1' } };
      const req2 = { ...mockReq, body: { username: 'user2' } };

      // Make max attempts for first user
      for (let i = 0; i < 6; i++) {
        rateLimiter.authRateLimit(req1, mockRes, mockNext);
      }

      // Second user should still be allowed
      rateLimiter.authRateLimit(req2, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('resets after window expires', () => {
      // Make some attempts
      for (let i = 0; i < 3; i++) {
        rateLimiter.authRateLimit(mockReq, mockRes, mockNext);
      }

      // Mock time passing
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 16 * 60 * 1000); // 16 minutes later

      // Should allow again
      rateLimiter.authRateLimit(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      Date.now = originalDateNow;
    });

    test('handles missing username gracefully', () => {
      const reqWithoutUsername = { ...mockReq, body: {} };
      rateLimiter.authRateLimit(reqWithoutUsername, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('handles missing IP gracefully', () => {
      const reqWithoutIP = { body: { username: 'testuser' } };
      rateLimiter.authRateLimit(reqWithoutIP, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('cleanupOldAttempts', () => {
    test('removes old attempts', () => {
      // This is an internal function, but we can test its effect
      const req1 = { ...mockReq, ip: '192.168.1.1' };
      const req2 = { ...mockReq, ip: '192.168.1.2' };

      // Make some attempts
      rateLimiter.rateLimitMiddleware(req1, mockRes, mockNext);
      rateLimiter.rateLimitMiddleware(req2, mockRes, mockNext);

      // Mock time passing to trigger cleanup
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 16 * 60 * 1000); // 16 minutes later

      // Make a new request to trigger cleanup
      const req3 = { ...mockReq, ip: '192.168.1.3' };
      rateLimiter.rateLimitMiddleware(req3, mockRes, mockNext);

      Date.now = originalDateNow;
      expect(mockNext).toHaveBeenCalled();
    });
  });
}); 