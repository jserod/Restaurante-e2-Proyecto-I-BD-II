// src/tests/jest.setup.js

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock database
jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(() => Promise.resolve({
    query: jest.fn(),
    release: jest.fn()
  }))
}));

// Mock memory store for express-session (incluye el método 'on')
const mockMemoryStore = {
  on: jest.fn((event, callback) => { callback(); }),
  all: jest.fn((cb) => cb(null, {})),
  clear: jest.fn((cb) => cb(null)),
  destroy: jest.fn((sid, cb) => cb(null)),
  get: jest.fn((sid, cb) => cb(null, null)),
  set: jest.fn((sid, session, cb) => cb(null)),
  touch: jest.fn((sid, session, cb) => cb(null)),
  length: jest.fn((cb) => cb(null, 0))
};

// Mock Keycloak (usado en todas las rutas)
jest.mock('../config/keycloak', () => ({
  keycloak: {
    protect: jest.fn(() => (req, res, next) => next()),
    middleware: jest.fn(() => (req, res, next) => next())
  },
  memoryStore: mockMemoryStore
}));
