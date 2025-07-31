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
  test('registers a new user as master', async () => {
    const result = await auth.registerUser('alice', 'secret', 'q', 'a');
    expect(result).toEqual({ created: true, isMaster: true });
  });

  test('prevents duplicate registration', async () => {
    await auth.registerUser('bob', 'pass');
    const result = await auth.registerUser('bob', 'other');
    expect(result.created).toBe(false);
    expect(result.code).toBe('exists');
  });

  test('authenticates registered user', async () => {
    // first user becomes master
    await auth.registerUser('carol', 'mypw');
    // second user is regular
    await auth.registerUser('erin', 'pw');

    let login = await auth.authenticateUser('carol', 'mypw');
    expect(login.ok).toBe(true);
    expect(login.userData.isMaster).toBe(true);

    login = await auth.authenticateUser('erin', 'pw');
    expect(login.ok).toBe(true);
    expect(login.userData.isMaster).toBe(false);
  });

  test('fails authentication for non-existent user', async () => {
    const result = await auth.authenticateUser('nonexistent', 'password');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('notfound');
  });

  test('fails authentication with wrong password', async () => {
    await auth.registerUser('testuser', 'correctpass');
    const result = await auth.authenticateUser('testuser', 'wrongpass');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('wrongpass');
  });

  test('resets password with secret answer', async () => {
    await auth.registerUser('dave', 'oldpw', 'pet', 'fluffy');
    let login = await auth.authenticateUser('dave', 'oldpw');
    expect(login.ok).toBe(true);

    const reset = await auth.resetPassword('dave', 'fluffy', 'newpw');
    expect(reset.ok).toBe(true);

    login = await auth.authenticateUser('dave', 'newpw');
    expect(login.ok).toBe(true);
  });

  test('fails password reset for non-existent user', async () => {
    const result = await auth.resetPassword('nonexistent', 'answer', 'newpass');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('notfound');
  });

  test('fails password reset with wrong answer', async () => {
    await auth.registerUser('testuser', 'pass', 'question', 'correct');
    const result = await auth.resetPassword('testuser', 'wrong', 'newpass');
    expect(result.ok).toBe(false);
    expect(result.code).toBe('wronganswer');
  });

  test('verifies user correctly', async () => {
    await auth.registerUser('verifyuser', 'password');
    const result = await auth.verifyUser('verifyuser', 'password');
    expect(result).toBe(true);
  });

  test('verifies resposta correctly', async () => {
    await auth.registerUser('respostauser', 'pass', 'question', 'answer');
    const result = await auth.verifyResposta('respostauser', 'answer');
    expect(result).toBe(true);
  });

  test('fails resposta verification for wrong answer', async () => {
    await auth.registerUser('respostauser', 'pass', 'question', 'answer');
    const result = await auth.verifyResposta('respostauser', 'wrong');
    expect(result).toBe(false);
  });
});
