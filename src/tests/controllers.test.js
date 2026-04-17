// src/tests/controllers.test.js

process.env.KEYCLOAK_URL = 'http://localhost:8080';
process.env.KEYCLOAK_REALM = 'myrealm';
process.env.KEYCLOAK_CLIENT_ID = 'restaurant-api';
process.env.KEYCLOAK_CLIENT_SECRET = 'secret';
process.env.KEYCLOAK_ADMIN = 'admin';
process.env.KEYCLOAK_ADMIN_PASSWORD = 'adminpass';

const usersController = require('../controllers/usersController');
const restaurantsController = require('../controllers/restaurantsController');
const menusController = require('../controllers/menusController');
const reservationsController = require('../controllers/ReservationsController');
const ordersController = require('../controllers/ordersController');
const authController = require('../controllers/authController');

jest.mock('../models/users');
jest.mock('../models/restaurants');
jest.mock('../models/menus');
jest.mock('../models/reservations');
jest.mock('../models/orders');

const usersModel = require('../models/users');
const restaurantsModel = require('../models/restaurants');
const menusModel = require('../models/menus');
const reservationsModel = require('../models/reservations');
const ordersModel = require('../models/orders');

// Helper mejorado para mockear fetchPost / fetchGet
function mockHttpRequest(responses) {
    const http = require('http');
    let callIndex = 0;
    http.request.mockImplementation((options, callback) => {
        const response = responses[callIndex++];
        const mockRequest = {
            on: jest.fn(),
            write: jest.fn(),
            end: jest.fn(() => {
                if (callback) {
                    // Simulamos el objeto res con los eventos 'data' y 'end'
                    const res = {
                        statusCode: response.status,
                        on: (event, handler) => {
                            if (event === 'data') {
                                const chunk = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
                                handler(chunk);
                            }
                            if (event === 'end') handler();
                        }
                    };
                    callback(res);
                }
            })
        };
        return mockRequest;
    });
}

describe('Controller Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { id: 1, dbId: 1 },
            kauth: null
        };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    // ========== Auth Controller ==========
    describe('Auth Controller', () => {
        it('login should return tokens on success', async () => {
            mockHttpRequest([
                {
                    status: 200,
                    body: JSON.stringify({
                        access_token: 'access123',
                        refresh_token: 'refresh123',
                        expires_in: 300
                    })
                }
            ]);
            req.body = { username: 'testuser', password: 'password123' };
            await authController.login(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                access_token: 'access123',
                refresh_token: 'refresh123',
                expires_in: 300
            });
        });

        it('login should return 400 if missing credentials', async () => {
            req.body = { username: 'testuser' };
            await authController.login(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'username and password are required' });
        });

        it('login should return 401 on invalid credentials', async () => {
            mockHttpRequest([
                { status: 401, body: JSON.stringify({ error: 'invalid_grant' }) }
            ]);
            req.body = { username: 'testuser', password: 'wrongpass' };
            await authController.login(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        });

        it('login should call next on error', async () => {
            const error = new Error('Network error');
            const http = require('http');
            http.request.mockImplementation(() => { throw error; });
            req.body = { username: 'testuser', password: 'password123' };
            await authController.login(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('register should create user successfully', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 201, body: '' },
                { status: 200, body: JSON.stringify([{ id: 'user123' }]) },
                { status: 200, body: JSON.stringify([{ id: 'client123', clientId: 'restaurant-api' }]) },
                { status: 200, body: JSON.stringify({ id: 'role123', name: 'user' }) },
                { status: 204, body: '' }
            ]);
            req.body = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
                role: 'user'
            };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'User registered successfully',
                username: 'newuser',
                role: 'user'
            });
        });

        it('register should return 400 if missing fields', async () => {
            req.body = { username: 'newuser', email: 'new@example.com' };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'username, email and password are required' });
        });

        it('register should return 409 if user already exists', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 409, body: '' }
            ]);
            req.body = {
                username: 'existinguser',
                email: 'existing@example.com',
                password: 'password123'
            };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'User already exists' });
        });

        it('register should call next on error', async () => {
            const error = new Error('Network error');
            const http = require('http');
            http.request.mockImplementation(() => { throw error; });
            req.body = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123'
            };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        // Pruebas adicionales para cubrir líneas de authController.js
        it('should handle getAdminToken failure (non-200 response)', async () => {
            mockHttpRequest([{ status: 500, body: JSON.stringify({ error: 'Server error' }) }]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle getAdminToken with invalid JSON response', async () => {
            mockHttpRequest([{ status: 200, body: 'invalid json { ' }]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle network errors during login', async () => {
            const error = new Error('Network timeout');
            const http = require('http');
            http.request.mockImplementation(() => { throw error; });
            req.body = { username: 'testuser', password: 'password123' };
            await authController.login(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should handle invalid JSON response from Keycloak in login', async () => {
            mockHttpRequest([{ status: 200, body: 'invalid json { ' }]);
            req.body = { username: 'testuser', password: 'password123' };
            await authController.login(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle when user is created but cannot be found', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 201, body: '' },
                { status: 200, body: JSON.stringify([]) }
            ]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'User created but could not be found' });
        });

        it('should handle when client is not found in Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 201, body: '' },
                { status: 200, body: JSON.stringify([{ id: 'user123' }]) },
                { status: 200, body: JSON.stringify([]) }
            ]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Client not found in Keycloak' });
        });

        it('should handle when role fetch fails', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 201, body: '' },
                { status: 200, body: JSON.stringify([{ id: 'user123' }]) },
                { status: 200, body: JSON.stringify([{ id: 'client123', clientId: 'restaurant-api' }]) },
                { status: 404, body: JSON.stringify({ error: 'Role not found' }) }
            ]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'admin' };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle network error during role assignment', async () => {
            let callCount = 0;
            const http = require('http');
            http.request.mockImplementation((options, callback) => {
                callCount++;
                const mockRequest = {
                    on: jest.fn(),
                    write: jest.fn(),
                    end: jest.fn(() => {
                        if (callCount <= 4) {
                            const responses = [
                                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                                { status: 201, body: '' },
                                { status: 200, body: JSON.stringify([{ id: 'user123' }]) },
                                { status: 200, body: JSON.stringify([{ id: 'client123', clientId: 'restaurant-api' }]) }
                            ];
                            callback(responses[callCount - 1]);
                        } else {
                            throw new Error('Network error');
                        }
                    })
                };
                return mockRequest;
            });
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should handle registration failure with non-201 status', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 400, body: JSON.stringify({ error: 'Bad request' }) }
            ]);
            req.body = { username: 'newuser', email: 'new@example.com', password: 'password123', role: 'user' };
            await authController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
        });
    });

    // ========== Users Controller ==========
    describe('Users Controller', () => {
        it('getUsers should return list from Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 200, body: JSON.stringify([{ id: '1', username: 'user1', email: 'user1@test.com', enabled: true }]) }
            ]);
            await usersController.getUsers(req, res, next);
            expect(res.json).toHaveBeenCalledWith([
                { id: '1', username: 'user1', email: 'user1@test.com', enabled: true }
            ]);
        });

        it('getUsers should call next on error', async () => {
            const error = new Error('API error');
            const http = require('http');
            http.request.mockImplementation(() => { throw error; });
            await usersController.getUsers(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getMe finds or creates user', async () => {
            const mockUser = { id: 1, email: 'a@b.com' };
            usersModel.findOrCreateUser.mockResolvedValue(mockUser);
            req.kauth = {
                grant: {
                    access_token: {
                        content: {
                            sub: 'key123',
                            email: 'a@b.com',
                            preferred_username: 'user'
                        }
                    }
                }
            };
            await usersController.getMe(req, res, next);
            expect(usersModel.findOrCreateUser).toHaveBeenCalledWith({
                keycloakId: 'key123',
                email: 'a@b.com',
                name: 'user'
            });
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('getMe calls next on error', async () => {
            const error = new Error('DB error');
            usersModel.findOrCreateUser.mockRejectedValue(error);
            req.kauth = {
                grant: {
                    access_token: {
                        content: { sub: 'key123', email: 'a@b.com', preferred_username: 'user' }
                    }
                }
            };
            await usersController.getMe(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('updateUser should update user in Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 200, body: '' }
            ]);
            req.params.id = 'user123';
            req.body = { username: 'updated', email: 'updated@test.com' };
            await usersController.updateUser(req, res, next);
            expect(res.json).toHaveBeenCalledWith({ message: 'User updated' });
        });

        it('updateUser should return 404 if user not found', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 404, body: '' }
            ]);
            req.params.id = 'user123';
            await usersController.updateUser(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('deleteUser should delete user from Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 200, body: '' }
            ]);
            req.params.id = 'user123';
            await usersController.deleteUser(req, res, next);
            expect(res.json).toHaveBeenCalledWith({ message: 'User deleted' });
        });

        it('deleteUser should return 404 if user not found', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 404, body: '' }
            ]);
            req.params.id = 'user123';
            await usersController.deleteUser(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
        });

        it('deleteUser should call next on error', async () => {
            const error = new Error('API error');
            const http = require('http');
            http.request.mockImplementation(() => { throw error; });
            req.params.id = 'user123';
            await usersController.deleteUser(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        // Pruebas adicionales para cubrir líneas 99,104,120,125 de usersController.js
        it('updateUser should handle network error during admin token fetch', async () => {
            const http = require('http');
            http.request.mockImplementation(() => { throw new Error('Network error'); });
            req.params.id = 'user123';
            req.body = { username: 'updated', email: 'updated@test.com' };
            await usersController.updateUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('updateUser should handle invalid JSON response from admin token', async () => {
            mockHttpRequest([{ status: 200, body: 'invalid json { ' }]);
            req.params.id = 'user123';
            req.body = { username: 'updated', email: 'updated@test.com' };
            await usersController.updateUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('deleteUser should handle network error during admin token fetch', async () => {
            const http = require('http');
            http.request.mockImplementation(() => { throw new Error('Network error'); });
            req.params.id = 'user123';
            await usersController.deleteUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('deleteUser should handle invalid JSON response from admin token', async () => {
            mockHttpRequest([{ status: 200, body: 'invalid json { ' }]);
            req.params.id = 'user123';
            await usersController.deleteUser(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('getUsers should handle non-200 response from Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 500, body: JSON.stringify({ error: 'Server error' }) }
            ]);
            await usersController.getUsers(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('getUsers should handle invalid JSON response from Keycloak', async () => {
            mockHttpRequest([
                { status: 200, body: JSON.stringify({ access_token: 'admin_token' }) },
                { status: 200, body: 'invalid json { ' }
            ]);
            await usersController.getUsers(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('getUsers should handle network error during admin token fetch', async () => {
            const http = require('http');
            http.request.mockImplementation(() => { throw new Error('Network error'); });
            await usersController.getUsers(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('getUsers should handle network error during users fetch', async () => {
            let callCount = 0;
            const http = require('http');
            http.request.mockImplementation((options, callback) => {
                callCount++;
                const mockRequest = {
                    on: jest.fn(),
                    write: jest.fn(),
                    end: jest.fn(() => {
                        if (callCount === 1) {
                            callback({ status: 200, body: JSON.stringify({ access_token: 'admin_token' }) });
                        } else {
                            throw new Error('Network error');
                        }
                    })
                };
                return mockRequest;
            });
            await usersController.getUsers(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    // ========== Restaurants Controller ==========
    describe('Restaurants Controller', () => {
        it('getRestaurants returns list', async () => {
            const mock = [{ id: 1 }];
            restaurantsModel.getAllRestaurants.mockResolvedValue(mock);
            await restaurantsController.getRestaurants(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getRestaurants should call next on error', async () => {
            const error = new Error('DB error');
            restaurantsModel.getAllRestaurants.mockRejectedValue(error);
            await restaurantsController.getRestaurants(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getRestaurantById returns if found', async () => {
            const mock = { id: 1 };
            restaurantsModel.getRestaurantById.mockResolvedValue(mock);
            req.params.id = '1';
            await restaurantsController.getRestaurantById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getRestaurantById returns 404 if not found', async () => {
            restaurantsModel.getRestaurantById.mockResolvedValue(null);
            req.params.id = '99';
            await restaurantsController.getRestaurantById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });

        it('getRestaurantById should call next on error', async () => {
            const error = new Error('DB error');
            restaurantsModel.getRestaurantById.mockRejectedValue(error);
            req.params.id = '1';
            await restaurantsController.getRestaurantById(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('createRestaurant creates', async () => {
            req.body = { name: 'R', description: 'D', address: 'A' };
            const created = { id: 1, ...req.body };
            restaurantsModel.createRestaurant.mockResolvedValue(created);
            await restaurantsController.createRestaurant(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(created);
        });

        it('createRestaurant should call next on error', async () => {
            const error = new Error('DB error');
            restaurantsModel.createRestaurant.mockRejectedValue(error);
            req.body = { name: 'R', description: 'D', address: 'A' };
            await restaurantsController.createRestaurant(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('updateRestaurant updates if exists', async () => {
            const existing = { id: 1 };
            restaurantsModel.getRestaurantById.mockResolvedValue(existing);
            req.params.id = '1';
            req.body = { name: 'new', description: 'new', address: 'new' };
            const updated = { id: 1, ...req.body };
            restaurantsModel.updateRestaurant.mockResolvedValue(updated);
            await restaurantsController.updateRestaurant(req, res, next);
            expect(restaurantsModel.updateRestaurant).toHaveBeenCalledWith('1', req.body);
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('updateRestaurant returns 404 if not found', async () => {
            restaurantsModel.getRestaurantById.mockResolvedValue(null);
            req.params.id = '99';
            await restaurantsController.updateRestaurant(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });

        it('updateRestaurant should call next on error', async () => {
            const error = new Error('DB error');
            restaurantsModel.getRestaurantById.mockRejectedValue(error);
            req.params.id = '1';
            await restaurantsController.updateRestaurant(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('deleteRestaurant deletes if exists', async () => {
            restaurantsModel.getRestaurantById.mockResolvedValue({ id: 1 });
            await restaurantsController.deleteRestaurant(req, res, next);
            expect(restaurantsModel.deleteRestaurant).toHaveBeenCalledWith(req.params.id);
            expect(res.json).toHaveBeenCalledWith({ message: 'Restaurant deleted' });
        });

        it('deleteRestaurant returns 404 if not found', async () => {
            restaurantsModel.getRestaurantById.mockResolvedValue(null);
            req.params.id = '99';
            await restaurantsController.deleteRestaurant(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Restaurant not found' });
        });

        it('deleteRestaurant should call next on error', async () => {
            const error = new Error('DB error');
            restaurantsModel.getRestaurantById.mockRejectedValue(error);
            req.params.id = '1';
            await restaurantsController.deleteRestaurant(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ========== Menus Controller ==========
    describe('Menus Controller', () => {
        it('getMenus returns menus for restaurant', async () => {
            const mock = [{ id: 1 }];
            menusModel.getMenusByRestaurant.mockResolvedValue(mock);
            req.params.restaurantId = '1';
            await menusController.getMenus(req, res, next);
            expect(menusModel.getMenusByRestaurant).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getMenus should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.getMenusByRestaurant.mockRejectedValue(error);
            req.params.restaurantId = '1';
            await menusController.getMenus(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getMenuById returns if found', async () => {
            const mock = { id: 1 };
            menusModel.getMenuById.mockResolvedValue(mock);
            req.params.id = '1';
            await menusController.getMenuById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getMenuById returns 404 if not found', async () => {
            menusModel.getMenuById.mockResolvedValue(null);
            req.params.id = '99';
            await menusController.getMenuById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Menu not found' });
        });

        it('getMenuById should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.getMenuById.mockRejectedValue(error);
            req.params.id = '1';
            await menusController.getMenuById(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('createMenu creates', async () => {
            req.body = { restaurantId: 1, name: 'Pizza', description: 'Yummy', price: 10 };
            const created = { id: 1, ...req.body };
            menusModel.createMenu.mockResolvedValue(created);
            await menusController.createMenu(req, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(created);
        });

        it('createMenu returns 400 if restaurantId missing', async () => {
            req.body = { name: 'Pizza' };
            await menusController.createMenu(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'restaurantId is required' });
        });

        it('createMenu should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.createMenu.mockRejectedValue(error);
            req.body = { restaurantId: 1, name: 'Pizza', price: 10 };
            await menusController.createMenu(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('updateMenu updates if exists', async () => {
            const existing = { id: 1 };
            menusModel.getMenuById.mockResolvedValue(existing);
            req.params.id = '1';
            req.body = { name: 'new', description: 'new', price: 20 };
            const updated = { id: 1, ...req.body };
            menusModel.updateMenu.mockResolvedValue(updated);
            await menusController.updateMenu(req, res, next);
            expect(menusModel.updateMenu).toHaveBeenCalledWith('1', req.body);
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('updateMenu returns 404 if not found', async () => {
            menusModel.getMenuById.mockResolvedValue(null);
            req.params.id = '99';
            await menusController.updateMenu(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Menu not found' });
        });

        it('updateMenu should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.getMenuById.mockRejectedValue(error);
            req.params.id = '1';
            await menusController.updateMenu(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('deleteMenu deletes if exists', async () => {
            menusModel.getMenuById.mockResolvedValue({ id: 1 });
            await menusController.deleteMenu(req, res, next);
            expect(menusModel.deleteMenu).toHaveBeenCalledWith(req.params.id);
            expect(res.json).toHaveBeenCalledWith({ message: 'Menu deleted' });
        });

        it('deleteMenu returns 404 if not found', async () => {
            menusModel.getMenuById.mockResolvedValue(null);
            req.params.id = '99';
            await menusController.deleteMenu(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Menu not found' });
        });

        it('deleteMenu should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.getMenuById.mockRejectedValue(error);
            req.params.id = '1';
            await menusController.deleteMenu(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getAllMenus returns list', async () => {
            const mock = [{ id: 1 }];
            menusModel.getAllMenus.mockResolvedValue(mock);
            await menusController.getAllMenus(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getAllMenus should call next on error', async () => {
            const error = new Error('DB error');
            menusModel.getAllMenus.mockRejectedValue(error);
            await menusController.getAllMenus(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ========== Reservations Controller ==========
    describe('Reservations Controller', () => {
        it('createReservation creates', async () => {
            req.body = { restaurantId: 1, partySize: 4, reservationDate: '2025-01-01', notes: 'test' };
            const created = { id: 1, user_id: 1, ...req.body };
            reservationsModel.createReservation.mockResolvedValue(created);
            await reservationsController.createReservation(req, res, next);
            expect(reservationsModel.createReservation).toHaveBeenCalledWith({
                userId: 1,
                restaurantId: 1,
                partySize: 4,
                reservationDate: '2025-01-01',
                notes: 'test'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(created);
        });

        it('createReservation should call next on error', async () => {
            const error = new Error('DB error');
            reservationsModel.createReservation.mockRejectedValue(error);
            req.body = { restaurantId: 1, partySize: 4, reservationDate: '2025-01-01' };
            await reservationsController.createReservation(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('cancelReservation cancels if owner', async () => {
            const reservation = { id: 1, user_id: 1 };
            reservationsModel.getReservationById.mockResolvedValue(reservation);
            const updated = { ...reservation, status: 'cancelled' };
            reservationsModel.cancelReservation.mockResolvedValue(updated);
            req.params.id = '1';
            req.user.dbId = 1;
            await reservationsController.cancelReservation(req, res, next);
            expect(reservationsModel.cancelReservation).toHaveBeenCalledWith('1');
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('cancelReservation returns 403 if not owner', async () => {
            const reservation = { id: 1, user_id: 2 };
            reservationsModel.getReservationById.mockResolvedValue(reservation);
            req.params.id = '1';
            req.user.dbId = 1;
            await reservationsController.cancelReservation(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
        });

        it('cancelReservation returns 404 if not found', async () => {
            reservationsModel.getReservationById.mockResolvedValue(null);
            req.params.id = '99';
            await reservationsController.cancelReservation(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });

        it('cancelReservation should call next on error', async () => {
            const error = new Error('DB error');
            reservationsModel.getReservationById.mockRejectedValue(error);
            req.params.id = '1';
            await reservationsController.cancelReservation(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getAllReservations returns list', async () => {
            const mock = [{ id: 1 }];
            reservationsModel.getAllReservations.mockResolvedValue(mock);
            await reservationsController.getAllReservations(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getAllReservations should call next on error', async () => {
            const error = new Error('DB error');
            reservationsModel.getAllReservations.mockRejectedValue(error);
            await reservationsController.getAllReservations(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('updateReservation updates if exists', async () => {
            const existing = { id: 1 };
            reservationsModel.getReservationById.mockResolvedValue(existing);
            req.params.id = '1';
            req.body = { partySize: 2, reservationDate: '2025-01-02', notes: 'updated' };
            const updated = { id: 1, ...req.body };
            reservationsModel.updateReservation.mockResolvedValue(updated);
            await reservationsController.updateReservation(req, res, next);
            expect(reservationsModel.updateReservation).toHaveBeenCalledWith('1', req.body);
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('updateReservation returns 404 if not found', async () => {
            reservationsModel.getReservationById.mockResolvedValue(null);
            req.params.id = '99';
            await reservationsController.updateReservation(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });

        it('updateReservation should call next on error', async () => {
            const error = new Error('DB error');
            reservationsModel.getReservationById.mockRejectedValue(error);
            req.params.id = '1';
            await reservationsController.updateReservation(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getReservationById returns if found', async () => {
            const mock = { id: 1 };
            reservationsModel.getReservationById.mockResolvedValue(mock);
            req.params.id = '1';
            await reservationsController.getReservationById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getReservationById returns 404 if not found', async () => {
            reservationsModel.getReservationById.mockResolvedValue(null);
            req.params.id = '99';
            await reservationsController.getReservationById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Reservation not found' });
        });

        it('getReservationById should call next on error', async () => {
            const error = new Error('DB error');
            reservationsModel.getReservationById.mockRejectedValue(error);
            req.params.id = '1';
            await reservationsController.getReservationById(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // ========== Orders Controller ==========
    describe('Orders Controller', () => {
        it('createOrder creates with items', async () => {
            req.body = { restaurantId: 1, items: [{ menuId: 1, quantity: 2 }] };
            const created = { id: 1 };
            ordersModel.createOrder.mockResolvedValue(created);
            await ordersController.createOrder(req, res, next);
            expect(ordersModel.createOrder).toHaveBeenCalledWith({
                userId: 1,
                restaurantId: 1,
                reservationId: undefined,
                pickup: undefined,
                items: [{ menuId: 1, quantity: 2 }]
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(created);
        });

        it('createOrder returns 400 if no items', async () => {
            req.body = { restaurantId: 1, items: [] };
            await ordersController.createOrder(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Order must have at least one item' });
        });

        it('createOrder should call next on error', async () => {
            const error = new Error('DB error');
            ordersModel.createOrder.mockRejectedValue(error);
            req.body = { restaurantId: 1, items: [{ menuId: 1, quantity: 2 }] };
            await ordersController.createOrder(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getOrderById returns if found', async () => {
            const mock = { id: 1 };
            ordersModel.getOrderById.mockResolvedValue(mock);
            req.params.id = '1';
            await ordersController.getOrderById(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getOrderById returns 404 if not found', async () => {
            ordersModel.getOrderById.mockResolvedValue(null);
            req.params.id = '99';
            await ordersController.getOrderById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
        });

        it('getOrderById should call next on error', async () => {
            const error = new Error('DB error');
            ordersModel.getOrderById.mockRejectedValue(error);
            req.params.id = '1';
            await ordersController.getOrderById(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('getAllOrders returns list', async () => {
            const mock = [{ id: 1 }];
            ordersModel.getAllOrders.mockResolvedValue(mock);
            await ordersController.getAllOrders(req, res, next);
            expect(res.json).toHaveBeenCalledWith(mock);
        });

        it('getAllOrders should call next on error', async () => {
            const error = new Error('DB error');
            ordersModel.getAllOrders.mockRejectedValue(error);
            await ordersController.getAllOrders(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('updateOrder updates if exists', async () => {
            const existing = { id: 1 };
            ordersModel.getOrderById.mockResolvedValue(existing);
            req.params.id = '1';
            req.body = { status: 'confirmed' };
            const updated = { ...existing, status: 'confirmed' };
            ordersModel.updateOrder.mockResolvedValue(updated);
            await ordersController.updateOrder(req, res, next);
            expect(ordersModel.updateOrder).toHaveBeenCalledWith('1', { status: 'confirmed' });
            expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('updateOrder returns 404 if not found', async () => {
            ordersModel.getOrderById.mockResolvedValue(null);
            req.params.id = '99';
            await ordersController.updateOrder(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
        });

        it('updateOrder should call next on error', async () => {
            const error = new Error('DB error');
            ordersModel.getOrderById.mockRejectedValue(error);
            req.params.id = '1';
            await ordersController.updateOrder(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });

        it('deleteOrder deletes if exists', async () => {
            ordersModel.getOrderById.mockResolvedValue({ id: 1 });
            await ordersController.deleteOrder(req, res, next);
            expect(ordersModel.deleteOrder).toHaveBeenCalledWith(req.params.id);
            expect(res.json).toHaveBeenCalledWith({ message: 'Order deleted' });
        });

        it('deleteOrder returns 404 if not found', async () => {
            ordersModel.getOrderById.mockResolvedValue(null);
            req.params.id = '99';
            await ordersController.deleteOrder(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
        });

        it('deleteOrder should call next on error', async () => {
            const error = new Error('DB error');
            ordersModel.getOrderById.mockRejectedValue(error);
            req.params.id = '1';
            await ordersController.deleteOrder(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});