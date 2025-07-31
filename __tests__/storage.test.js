const fs = require('fs');
const path = require('path');
const os = require('os');

let storage;
let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `users-${Date.now()}.json`);
  process.env.USERS_FILE = tmpFile;
  jest.resetModules();
  storage = require('../server/storage');
});

afterEach(() => {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
  delete process.env.USERS_FILE;
});

describe('storage module', () => {
  test('creates users file if it does not exist', async () => {
    expect(fs.existsSync(tmpFile)).toBe(false);
    await storage.ensureUsersFile();
    expect(fs.existsSync(tmpFile)).toBe(true);
    
    const content = fs.readFileSync(tmpFile, 'utf-8');
    expect(JSON.parse(content)).toEqual({});
  });

  test('loads empty users when file is empty', async () => {
    await storage.ensureUsersFile();
    const users = await storage.loadUsers();
    expect(users).toEqual({});
  });

  test('loads existing users from file', async () => {
    const testUsers = {
      'user1': { passwordHash: 'hash1', isMaster: true },
      'user2': { passwordHash: 'hash2', isMaster: false }
    };
    
    fs.writeFileSync(tmpFile, JSON.stringify(testUsers), 'utf-8');
    const users = await storage.loadUsers();
    expect(users).toEqual(testUsers);
  });

  test('saves users to file', async () => {
    const testUsers = {
      'user1': { passwordHash: 'hash1', isMaster: true },
      'user2': { passwordHash: 'hash2', isMaster: false }
    };
    
    await storage.saveUsers(testUsers);
    expect(fs.existsSync(tmpFile)).toBe(true);
    
    const content = fs.readFileSync(tmpFile, 'utf-8');
    const savedUsers = JSON.parse(content);
    expect(savedUsers).toEqual(testUsers);
  });

  test('handles corrupted JSON gracefully', async () => {
    fs.writeFileSync(tmpFile, 'invalid json content', 'utf-8');
    
    await expect(storage.loadUsers()).rejects.toThrow();
  });

  test('uses cache for repeated loads', async () => {
    const testUsers = { 'user1': { passwordHash: 'hash1' } };
    fs.writeFileSync(tmpFile, JSON.stringify(testUsers), 'utf-8');
    
    // First load
    const users1 = await storage.loadUsers();
    expect(users1).toEqual(testUsers);
    
    // Modify file directly
    fs.writeFileSync(tmpFile, JSON.stringify({ 'user2': { passwordHash: 'hash2' } }), 'utf-8');
    
    // Second load should use cache
    const users2 = await storage.loadUsers();
    expect(users2).toEqual(testUsers); // Should still return cached version
  });

  test('invalidates cache when saving', async () => {
    const testUsers1 = { 'user1': { passwordHash: 'hash1' } };
    const testUsers2 = { 'user2': { passwordHash: 'hash2' } };
    
    fs.writeFileSync(tmpFile, JSON.stringify(testUsers1), 'utf-8');
    await storage.loadUsers(); // Load into cache
    
    await storage.saveUsers(testUsers2);
    
    const users = await storage.loadUsers();
    expect(users).toEqual(testUsers2); // Should return new data, not cached
  });

  test('invalidates cache manually', async () => {
    const testUsers = { 'user1': { passwordHash: 'hash1' } };
    fs.writeFileSync(tmpFile, JSON.stringify(testUsers), 'utf-8');
    
    await storage.loadUsers(); // Load into cache
    storage.invalidateCache();
    
    // Modify file
    fs.writeFileSync(tmpFile, JSON.stringify({ 'user2': { passwordHash: 'hash2' } }), 'utf-8');
    
    const users = await storage.loadUsers();
    expect(users).toEqual({ 'user2': { passwordHash: 'hash2' } });
  });

  test('handles file system errors gracefully', async () => {
    // Test with invalid file path
    const invalidPath = '/invalid/path/users.json';
    process.env.USERS_FILE = invalidPath;
    
    jest.resetModules();
    const newStorage = require('../server/storage');
    
    await expect(newStorage.loadUsers()).rejects.toThrow();
  });

  test('atomic save operation with temp file', async () => {
    const testUsers = { 'user1': { passwordHash: 'hash1' } };
    
    await storage.saveUsers(testUsers);
    
    // Check that temp file was cleaned up
    const tempFile = `${tmpFile}.tmp`;
    expect(fs.existsSync(tempFile)).toBe(false);
    expect(fs.existsSync(tmpFile)).toBe(true);
    
    const content = fs.readFileSync(tmpFile, 'utf-8');
    expect(JSON.parse(content)).toEqual(testUsers);
  });
});
