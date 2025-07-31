const configModule = require('../config');

describe('config module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('config object', () => {
    test('has required configuration sections', () => {
      const { config } = configModule;
      
      expect(config).toHaveProperty('server');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('frontend');
      expect(config).toHaveProperty('development');
      expect(config).toHaveProperty('validation');
      expect(config).toHaveProperty('errors');
    });

    test('server configuration has correct defaults', () => {
      const { config } = configModule;
      
      expect(config.server.port).toBe(3000);
      expect(config.server.host).toBe('0.0.0.0');
      expect(config.server.enableUsersRoute).toBe(false);
    });

    test('security configuration has correct defaults', () => {
      const { config } = configModule;
      
      expect(config.security.rateLimit.windowMs).toBe(15 * 60 * 1000);
      expect(config.security.rateLimit.maxAttempts).toBe(5);
      expect(config.security.bcrypt.saltRounds).toBe(10);
    });

    test('validation configuration has correct defaults', () => {
      const { config } = configModule;
      
      expect(config.validation.username.minLength).toBe(3);
      expect(config.validation.username.maxLength).toBe(20);
      expect(config.validation.password.minLength).toBe(6);
      expect(config.validation.password.maxLength).toBe(100);
    });
  });

  describe('getConfig function', () => {
    test('returns correct value for simple path', () => {
      const { getConfig } = configModule;
      
      expect(getConfig('server.port')).toBe(3000);
      expect(getConfig('security.bcrypt.saltRounds')).toBe(10);
    });

    test('returns undefined for invalid path', () => {
      const { getConfig } = configModule;
      
      expect(getConfig('invalid.path')).toBeUndefined();
      expect(getConfig('server.invalid')).toBeUndefined();
    });

    test('returns undefined for empty path', () => {
      const { getConfig } = configModule;
      
      expect(getConfig('')).toBeUndefined();
    });
  });

  describe('setConfig function', () => {
    test('sets value for existing path', () => {
      const { setConfig, getConfig } = configModule;
      
      setConfig('server.port', 8080);
      expect(getConfig('server.port')).toBe(8080);
    });

    test('creates new path if it does not exist', () => {
      const { setConfig, getConfig } = configModule;
      
      setConfig('custom.newProperty', 'testValue');
      expect(getConfig('custom.newProperty')).toBe('testValue');
    });

    test('creates nested objects as needed', () => {
      const { setConfig, getConfig } = configModule;
      
      setConfig('deeply.nested.property', 'value');
      expect(getConfig('deeply.nested.property')).toBe('value');
    });
  });

  describe('environment configurations', () => {
    test('development config enables debug mode', () => {
      const { environmentConfigs } = configModule;
      
      expect(environmentConfigs.development.development.debug).toBe(true);
      expect(environmentConfigs.development.development.logLevel).toBe('debug');
    });

    test('production config disables debug mode', () => {
      const { environmentConfigs } = configModule;
      
      expect(environmentConfigs.production.development.debug).toBe(false);
      expect(environmentConfigs.production.development.logLevel).toBe('error');
    });

    test('production config has stricter rate limiting', () => {
      const { environmentConfigs } = configModule;
      
      expect(environmentConfigs.production.security.rateLimit.maxAttempts).toBe(3);
    });

    test('test config uses test file path', () => {
      const { environmentConfigs } = configModule;
      
      expect(environmentConfigs.test.storage.usersFile).toBe('./test-users.json');
    });
  });

  describe('loadEnvironmentConfig function', () => {
    test('loads development config by default', () => {
      const { loadEnvironmentConfig } = configModule;
      
      const config = loadEnvironmentConfig();
      expect(config.development.debug).toBe(true);
    });

    test('loads production config when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      const { loadEnvironmentConfig } = configModule;
      
      const config = loadEnvironmentConfig();
      expect(config.development.debug).toBe(false);
    });

    test('loads test config when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      const { loadEnvironmentConfig } = configModule;
      
      const config = loadEnvironmentConfig();
      expect(config.storage.usersFile).toBe('./test-users.json');
    });

    test('handles unknown environment gracefully', () => {
      const { loadEnvironmentConfig } = configModule;
      
      const config = loadEnvironmentConfig('unknown');
      expect(config).toBeDefined();
    });
  });

  describe('environment variable overrides', () => {
    test('PORT environment variable overrides default port', () => {
      process.env.PORT = '8080';
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.server.port).toBe('8080'); // PORT é sempre string
    });

    test('ENABLE_USERS_ROUTE environment variable enables users route', () => {
      process.env.ENABLE_USERS_ROUTE = 'true';
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.server.enableUsersRoute).toBe(true);
    });

    test('MASTER_PASSWORD_HASH environment variable is set', () => {
      process.env.MASTER_PASSWORD_HASH = 'test-hash';
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.server.masterPasswordHash).toBe('test-hash');
    });

    test('USERS_FILE_PATH environment variable overrides default path', () => {
      process.env.USERS_FILE_PATH = '/custom/path/users.json';
      jest.resetModules();
      const { config } = require('../config');
      
      expect(config.storage.usersFile).toBe('/custom/path/users.json');
    });
  });
}); 