// src/tests/routes.test.js

// Mock todos los controladores
jest.mock('../controllers/usersController');
jest.mock('../controllers/restaurantsController');
jest.mock('../controllers/menusController');
jest.mock('../controllers/ReservationsController');
jest.mock('../controllers/ordersController');
jest.mock('../controllers/authController');

// Mock middlewares para las rutas (así no interfieren)
jest.mock('../middlewares/attachUser', () => jest.fn((req, res, next) => next()));
jest.mock('../middlewares/authUser', () => jest.fn((req, res, next) => next()));
jest.mock('../middlewares/requireRole', () => jest.fn(() => (req, res, next) => next()));

// Importar app después de los mocks
const request = require('supertest');
const app = require('../app');

const usersController = require('../controllers/usersController');
const restaurantsController = require('../controllers/restaurantsController');
const menusController = require('../controllers/menusController');
const reservationsController = require('../controllers/ReservationsController');
const ordersController = require('../controllers/ordersController');
const authController = require('../controllers/authController');

describe('Route Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /health returns 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'OK', message: 'Restaurant API running' });
    });

    it('GET / returns 200', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'API funcionando correctamente' });
    });

    // Users routes
    it('GET /users should call getUsers controller', async () => {
        usersController.getUsers.mockImplementation((req, res) => res.json([]));
        await request(app).get('/users');
        expect(usersController.getUsers).toHaveBeenCalled();
    });

    it('GET /users/me should call getMe controller', async () => {
        usersController.getMe.mockImplementation((req, res) => res.json({}));
        await request(app).get('/users/me');
        expect(usersController.getMe).toHaveBeenCalled();
    });

    it('PUT /users/:id should call updateUser controller', async () => {
        usersController.updateUser.mockImplementation((req, res) => res.json({}));
        await request(app).put('/users/1').send({ name: 'new' });
        expect(usersController.updateUser).toHaveBeenCalled();
    });

    it('DELETE /users/:id should call deleteUser controller', async () => {
        usersController.deleteUser.mockImplementation((req, res) => res.json({}));
        await request(app).delete('/users/1');
        expect(usersController.deleteUser).toHaveBeenCalled();
    });

    // Restaurants routes
    it('GET /restaurants should call getRestaurants', async () => {
        restaurantsController.getRestaurants.mockImplementation((req, res) => res.json([]));
        await request(app).get('/restaurants');
        expect(restaurantsController.getRestaurants).toHaveBeenCalled();
    });

    it('GET /restaurants/:id should call getRestaurantById', async () => {
        restaurantsController.getRestaurantById.mockImplementation((req, res) => res.json({}));
        await request(app).get('/restaurants/1');
        expect(restaurantsController.getRestaurantById).toHaveBeenCalled();
    });

    it('POST /restaurants should call createRestaurant', async () => {
        restaurantsController.createRestaurant.mockImplementation((req, res) => res.status(201).json({}));
        await request(app).post('/restaurants').send({ name: 'R', address: 'A' });
        expect(restaurantsController.createRestaurant).toHaveBeenCalled();
    });

    it('PUT /restaurants/:id should call updateRestaurant', async () => {
        restaurantsController.updateRestaurant.mockImplementation((req, res) => res.json({}));
        await request(app).put('/restaurants/1').send({ name: 'new' });
        expect(restaurantsController.updateRestaurant).toHaveBeenCalled();
    });

    it('DELETE /restaurants/:id should call deleteRestaurant', async () => {
        restaurantsController.deleteRestaurant.mockImplementation((req, res) => res.json({}));
        await request(app).delete('/restaurants/1');
        expect(restaurantsController.deleteRestaurant).toHaveBeenCalled();
    });

    // Menus routes
    it('GET /menus should call getAllMenus', async () => {
        menusController.getAllMenus.mockImplementation((req, res) => res.json([]));
        await request(app).get('/menus');
        expect(menusController.getAllMenus).toHaveBeenCalled();
    });

    it('GET /menus/:id should call getMenuById', async () => {
        menusController.getMenuById.mockImplementation((req, res) => res.json({}));
        await request(app).get('/menus/1');
        expect(menusController.getMenuById).toHaveBeenCalled();
    });

    it('POST /menus should call createMenu', async () => {
        menusController.createMenu.mockImplementation((req, res) => res.status(201).json({}));
        await request(app).post('/menus').send({ restaurantId: 1, name: 'Pizza', price: 10 });
        expect(menusController.createMenu).toHaveBeenCalled();
    });

    it('PUT /menus/:id should call updateMenu', async () => {
        menusController.updateMenu.mockImplementation((req, res) => res.json({}));
        await request(app).put('/menus/1').send({ name: 'new' });
        expect(menusController.updateMenu).toHaveBeenCalled();
    });

    it('DELETE /menus/:id should call deleteMenu', async () => {
        menusController.deleteMenu.mockImplementation((req, res) => res.json({}));
        await request(app).delete('/menus/1');
        expect(menusController.deleteMenu).toHaveBeenCalled();
    });

    // Reservations routes
    it('POST /reservations should call createReservation', async () => {
        reservationsController.createReservation.mockImplementation((req, res) => res.status(201).json({}));
        await request(app).post('/reservations').send({ restaurantId: 1, partySize: 4, reservationDate: '2025-01-01' });
        expect(reservationsController.createReservation).toHaveBeenCalled();
    });

    it('GET /reservations should call getAllReservations', async () => {
        reservationsController.getAllReservations.mockImplementation((req, res) => res.json([]));
        await request(app).get('/reservations');
        expect(reservationsController.getAllReservations).toHaveBeenCalled();
    });

    it('GET /reservations/:id should call getReservationById', async () => {
        reservationsController.getReservationById.mockImplementation((req, res) => res.json({}));
        await request(app).get('/reservations/1');
        expect(reservationsController.getReservationById).toHaveBeenCalled();
    });

    it('PUT /reservations/:id should call updateReservation', async () => {
        reservationsController.updateReservation.mockImplementation((req, res) => res.json({}));
        await request(app).put('/reservations/1').send({ partySize: 2 });
        expect(reservationsController.updateReservation).toHaveBeenCalled();
    });

    it('DELETE /reservations/:id should call cancelReservation', async () => {
        reservationsController.cancelReservation.mockImplementation((req, res) => res.json({}));
        await request(app).delete('/reservations/1');
        expect(reservationsController.cancelReservation).toHaveBeenCalled();
    });

    // Orders routes
    it('POST /orders should call createOrder', async () => {
        ordersController.createOrder.mockImplementation((req, res) => res.status(201).json({}));
        await request(app).post('/orders').send({ restaurantId: 1, items: [{ menuId: 1, quantity: 2 }] });
        expect(ordersController.createOrder).toHaveBeenCalled();
    });

    it('GET /orders should call getAllOrders', async () => {
        ordersController.getAllOrders.mockImplementation((req, res) => res.json([]));
        await request(app).get('/orders');
        expect(ordersController.getAllOrders).toHaveBeenCalled();
    });

    it('GET /orders/:id should call getOrderById', async () => {
        ordersController.getOrderById.mockImplementation((req, res) => res.json({}));
        await request(app).get('/orders/1');
        expect(ordersController.getOrderById).toHaveBeenCalled();
    });

    it('PUT /orders/:id should call updateOrder', async () => {
        ordersController.updateOrder.mockImplementation((req, res) => res.json({}));
        await request(app).put('/orders/1').send({ status: 'confirmed' });
        expect(ordersController.updateOrder).toHaveBeenCalled();
    });

    it('DELETE /orders/:id should call deleteOrder', async () => {
        ordersController.deleteOrder.mockImplementation((req, res) => res.json({}));
        await request(app).delete('/orders/1');
        expect(ordersController.deleteOrder).toHaveBeenCalled();
    });

    // 404 handler
    it('should return 404 for unknown route', async () => {
        const res = await request(app).get('/unknown');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Route not found' });
    });
});