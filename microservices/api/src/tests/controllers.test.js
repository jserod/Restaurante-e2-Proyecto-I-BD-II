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

    // ========== Auth Controller ===});