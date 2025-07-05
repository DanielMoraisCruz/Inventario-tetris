const fs = require('fs');
const path = require('path');
const os = require('os');

let storage;
let tmpFile;

describe('storage module', () => {
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

  test('ensureUsersFile creates file', () => {
    storage.ensureUsersFile();
    expect(fs.existsSync(tmpFile)).toBe(true);
  });

  test('saveUsers and loadUsers work', () => {
    const data = { alice: { passwordHash: 'hash', isMaster: true } };
    storage.saveUsers(data);
    const loaded = storage.loadUsers();
    expect(loaded).toEqual(data);
  });
});
