const fs = require('fs');
const path = require('path');
const os = require('os');

let auth;
let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `users-${Date.now()}.json`);
  process.env.USERS_FILE = tmpFile;
  jest.resetModules();
  auth = require('../server/auth');
});

afterEach(() => {
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
  delete process.env.USERS_FILE;
});

describe('auth module', () => {
  test('registers a new user as master', () => {
    const result = auth.registerUser('alice', 'secret', 'q', 'a');
    expect(result).toEqual({ created: true, isMaster: true });
  });

  test('prevents duplicate registration', () => {
    auth.registerUser('bob', 'pass');
    const result = auth.registerUser('bob', 'other');
    expect(result.created).toBe(false);
    expect(result.code).toBe('exists');
  });

  test('authenticates registered user', () => {
    // first user becomes master
    auth.registerUser('carol', 'mypw');
    // second user is regular
    auth.registerUser('erin', 'pw');

    let login = auth.authenticateUser('carol', 'mypw');
    expect(login.ok).toBe(true);
    expect(login.userData.isMaster).toBe(true);

    login = auth.authenticateUser('erin', 'pw');
    expect(login.ok).toBe(true);
    expect(login.userData.isMaster).toBe(false);
  });

  test('resets password with secret answer', () => {
    auth.registerUser('dave', 'oldpw', 'pet', 'fluffy');
    let login = auth.authenticateUser('dave', 'oldpw');
    expect(login.ok).toBe(true);

    const reset = auth.resetPassword('dave', 'fluffy', 'newpw');
    expect(reset.ok).toBe(true);

    login = auth.authenticateUser('dave', 'newpw');
    expect(login.ok).toBe(true);
  });
});
