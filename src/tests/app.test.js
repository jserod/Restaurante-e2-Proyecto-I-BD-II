// src/tests/app.test.js

// Mockear controladores
jest.mock('../controllers/usersController', () => ({
    getUsers: jest.fn(),
    getMe: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    createUser: jest.fn()
}));
jest.mock('../controllers/restaurantsController');
jest.mock('../controllers/menusController');
jest.mock('../controllers/ReservationsController');
jest.mock('../controllers/ordersController');
jest.mock('../controllers/authController');

// Mockear middlewares para evitar bloqueos de Keycloak
jest.mock('../middlewares/attachUser', () => jest.fn((req, res, next) => next()));
jest.mock('../middlewares/authUser', () => jest.fn((req, res, next) => next()));
jest.mock('../middlewares/requireRole', () => jest.fn(() => (req, res, next) => next()));

// Importar app después de los mocks
const request = require('supertest');
const app = require('../app');
const usersController = require('../controllers/usersController');

describe('App Integration', () => {
    it('should handle internal server error', async () => {
        usersController.getUsers.mockImplementation(() => {
            throw new Error('Test error');
        });
        const res = await request(app).get('/users');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Internal server error' });
    });
});