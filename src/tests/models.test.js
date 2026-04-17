// src/tests/models.test.js
const pool = require('../config/database');
const usersModel = require('../models/users');
const restaurantsModel = require('../models/restaurants');
const menusModel = require('../models/menus');
const reservationsModel = require('../models/reservations');
const ordersModel = require('../models/orders');

describe('Model Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Users Model', () => {
        it('getAllUsers returns list', async () => {
            const mockRows = [{ id: 1, keycloak_id: 'k1', email: 'a@b.com', name: 'A', role: 'client' }];
            pool.query.mockResolvedValue({ rows: mockRows });
            const result = await usersModel.getAllUsers();
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT id, keycloak_id, email, name, role FROM users ORDER BY id'
            );
            expect(result).toEqual(mockRows);
        });

        it('findOrCreateUser finds existing by keycloak_id', async () => {
            const mockUser = { id: 1, keycloak_id: 'k1', email: 'a@b.com', name: 'A' };
            pool.query.mockResolvedValueOnce({ rows: [mockUser] });
            const result = await usersModel.findOrCreateUser({ keycloakId: 'k1', email: 'a@b.com', name: 'A' });
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE keycloak_id = $1', ['k1']);
            expect(result).toEqual(mockUser);
        });

        it('findOrCreateUser updates by email if exists', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] }); // no keycloak_id
            pool.query.mockResolvedValueOnce({ rows: [{ id: 2, email: 'a@b.com' }] }); // found by email
            const updatedUser = { id: 2, keycloak_id: 'k1', email: 'a@b.com', name: 'A' };
            pool.query.mockResolvedValueOnce({ rows: [updatedUser] });
            const result = await usersModel.findOrCreateUser({ keycloakId: 'k1', email: 'a@b.com', name: 'A' });
            expect(pool.query).toHaveBeenCalledWith(
                'UPDATE users SET keycloak_id = $1 WHERE email = $2 RETURNING *',
                ['k1', 'a@b.com']
            );
            expect(result).toEqual(updatedUser);
        });

        it('findOrCreateUser creates new user', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] }); // no keycloak
            pool.query.mockResolvedValueOnce({ rows: [] }); // no email
            const newUser = { id: 3, keycloak_id: 'k1', email: 'a@b.com', name: 'A' };
            pool.query.mockResolvedValueOnce({ rows: [newUser] });
            const result = await usersModel.findOrCreateUser({ keycloakId: 'k1', email: 'a@b.com', name: 'A' });
            expect(pool.query).toHaveBeenCalledWith(
                `INSERT INTO users (keycloak_id, email, name)
         VALUES ($1, $2, $3)
         RETURNING *`,
                ['k1', 'a@b.com', 'A']
            );
            expect(result).toEqual(newUser);
        });

        it('getUserById returns user', async () => {
            const mockUser = { id: 1 };
            pool.query.mockResolvedValue({ rows: [mockUser] });
            const result = await usersModel.getUserById(1);
            expect(pool.query).toHaveBeenCalledWith(
                'SELECT id, keycloak_id, email, name, role FROM users WHERE id = $1',
                [1]
            );
            expect(result).toEqual(mockUser);
        });

        it('updateUser updates and returns', async () => {
            const updated = { id: 1, name: 'new', email: 'new@b.com' };
            pool.query.mockResolvedValue({ rows: [updated] });
            const result = await usersModel.updateUser(1, { name: 'new', email: 'new@b.com' });
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE users
         SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, keycloak_id, email, name, role`,
                ['new', 'new@b.com', 1]
            );
            expect(result).toEqual(updated);
        });

        it('deleteUser deletes', async () => {
            pool.query.mockResolvedValue({});
            await usersModel.deleteUser(1);
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', [1]);
        });

        it('createUser creates with role default', async () => {
            const newUser = { id: 1, keycloak_id: 'k1', email: 'a@b.com', name: 'A', role: 'client' };
            pool.query.mockResolvedValue({ rows: [newUser] });
            const result = await usersModel.createUser({ keycloakId: 'k1', email: 'a@b.com', name: 'A' });
            expect(pool.query).toHaveBeenCalledWith(
                `INSERT INTO users (keycloak_id, email, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, keycloak_id, email, name, role`,
                ['k1', 'a@b.com', 'A', 'client']
            );
            expect(result).toEqual(newUser);
        });
    });

    describe('Restaurants Model', () => {
        const mockRows = [{ id: 1, name: 'Rest', description: 'desc', address: 'addr' }];

        it('getAllRestaurants', async () => {
            pool.query.mockResolvedValue({ rows: mockRows });
            const result = await restaurantsModel.getAllRestaurants();
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM restaurants ORDER BY id');
            expect(result).toEqual(mockRows);
        });

        it('getRestaurantById', async () => {
            pool.query.mockResolvedValue({ rows: [mockRows[0]] });
            const result = await restaurantsModel.getRestaurantById(1);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM restaurants WHERE id = $1', [1]);
            expect(result).toEqual(mockRows[0]);
        });

        it('createRestaurant', async () => {
            pool.query.mockResolvedValue({ rows: [mockRows[0]] });
            const result = await restaurantsModel.createRestaurant({ name: 'Rest', description: 'desc', address: 'addr' });
            expect(pool.query).toHaveBeenCalledWith(
                `INSERT INTO restaurants (name, description, address)
         VALUES ($1, $2, $3)
         RETURNING *`,
                ['Rest', 'desc', 'addr']
            );
            expect(result).toEqual(mockRows[0]);
        });

        it('updateRestaurant', async () => {
            const updated = { id: 1, name: 'New', description: 'new', address: 'new' };
            pool.query.mockResolvedValue({ rows: [updated] });
            const result = await restaurantsModel.updateRestaurant(1, { name: 'New', description: 'new', address: 'new' });
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE restaurants
         SET name = $1, description = $2, address = $3
         WHERE id = $4
         RETURNING *`,
                ['New', 'new', 'new', 1]
            );
            expect(result).toEqual(updated);
        });

        it('deleteRestaurant', async () => {
            pool.query.mockResolvedValue({});
            await restaurantsModel.deleteRestaurant(1);
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM restaurants WHERE id = $1', [1]);
        });
    });

    describe('Menus Model', () => {
        const mockRow = { id: 1, restaurant_id: 1, name: 'Pizza', description: 'Yummy', price: 10.5 };

        it('getAllMenus', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await menusModel.getAllMenus();
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM menus ORDER BY id');
            expect(result).toEqual([mockRow]);
        });

        it('getMenusByRestaurant', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await menusModel.getMenusByRestaurant(1);
            expect(pool.query).toHaveBeenCalledWith(
                `SELECT * FROM menus
         WHERE restaurant_id = $1
         ORDER BY id`,
                [1]
            );
            expect(result).toEqual([mockRow]);
        });

        it('getMenuById', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await menusModel.getMenuById(1);
            expect(pool.query).toHaveBeenCalledWith('SELECT * FROM menus WHERE id = $1', [1]);
            expect(result).toEqual(mockRow);
        });

        it('createMenu', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await menusModel.createMenu({ restaurantId: 1, name: 'Pizza', description: 'Yummy', price: 10.5 });
            expect(pool.query).toHaveBeenCalledWith(
                `INSERT INTO menus (restaurant_id, name, description, price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [1, 'Pizza', 'Yummy', 10.5]
            );
            expect(result).toEqual(mockRow);
        });

        it('updateMenu', async () => {
            const updated = { id: 1, name: 'New', description: 'New', price: 20 };
            pool.query.mockResolvedValue({ rows: [updated] });
            const result = await menusModel.updateMenu(1, { name: 'New', description: 'New', price: 20 });
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE menus
         SET name = $1, description = $2, price = $3
         WHERE id = $4
         RETURNING *`,
                ['New', 'New', 20, 1]
            );
            expect(result).toEqual(updated);
        });

        it('deleteMenu', async () => {
            pool.query.mockResolvedValue({});
            await menusModel.deleteMenu(1);
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM menus WHERE id = $1', [1]);
        });
    });

    describe('Reservations Model', () => {
        const mockRow = { id: 1, user_id: 1, restaurant_id: 1, party_size: 4, reservation_date: '2025-01-01', notes: 'test', status: 'active' };

        it('getReservationById', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await reservationsModel.getReservationById(1);
            expect(pool.query).toHaveBeenCalledWith(
                `SELECT r.*, u.name AS guest, res.name AS restaurant
         FROM reservations r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN restaurants res ON res.id = r.restaurant_id
         WHERE r.id = $1`,
                [1]
            );
            expect(result).toEqual(mockRow);
        });

        it('createReservation', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await reservationsModel.createReservation({ userId: 1, restaurantId: 1, partySize: 4, reservationDate: '2025-01-01', notes: 'test' });
            expect(pool.query).toHaveBeenCalledWith(
                `INSERT INTO reservations (user_id, restaurant_id, party_size, reservation_date, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
                [1, 1, 4, '2025-01-01', 'test']
            );
            expect(result).toEqual(mockRow);
        });

        it('cancelReservation', async () => {
            const cancelled = { ...mockRow, status: 'cancelled' };
            pool.query.mockResolvedValue({ rows: [cancelled] });
            const result = await reservationsModel.cancelReservation(1);
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE reservations
         SET status = 'cancelled'
         WHERE id = $1
         RETURNING *`,
                [1]
            );
            expect(result).toEqual(cancelled);
        });

        it('getAllReservations', async () => {
            pool.query.mockResolvedValue({ rows: [mockRow] });
            const result = await reservationsModel.getAllReservations();
            expect(pool.query).toHaveBeenCalledWith(
                `SELECT r.*, u.name AS guest, res.name AS restaurant
         FROM reservations r
         LEFT JOIN users u ON u.id = r.user_id
         LEFT JOIN restaurants res ON res.id = r.restaurant_id
         ORDER BY r.id`
            );
            expect(result).toEqual([mockRow]);
        });

        it('updateReservation', async () => {
            const updated = { ...mockRow, party_size: 2 };
            pool.query.mockResolvedValue({ rows: [updated] });
            const result = await reservationsModel.updateReservation(1, { partySize: 2, reservationDate: '2025-01-02', notes: 'updated' });
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE reservations
         SET party_size = $1, reservation_date = $2, notes = $3
         WHERE id = $4
         RETURNING *`,
                [2, '2025-01-02', 'updated', 1]
            );
            expect(result).toEqual(updated);
        });
    });

    describe('Orders Model', () => {
        const mockOrder = { id: 1, user_id: 1, restaurant_id: 1, reservation_id: null, pickup: false, total: 20, status: 'pending' };
        const mockItem = { menu_id: 1, name: 'Pizza', quantity: 2, unit_price: 10 };

        beforeEach(() => {
            pool.connect.mockReset();
        });

        it('getOrderById with items', async () => {
            const orderWithItems = { ...mockOrder, items: [mockItem] };
            pool.query.mockResolvedValue({ rows: [orderWithItems] });
            const result = await ordersModel.getOrderById(1);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT o.*'),
                [1]
            );
            expect(result).toEqual(orderWithItems);
        });

        it('createOrder successfully', async () => {
            const client = { query: jest.fn(), release: jest.fn() }
            pool.connect.mockResolvedValue(client)

            client.query
                .mockResolvedValueOnce(undefined)                        // BEGIN
                .mockResolvedValueOnce({ rows: [{ price: 10 }] })       // precio menu 1 (total calc)
                .mockResolvedValueOnce({ rows: [{ price: 15 }] })       // precio menu 2 (total calc)
                .mockResolvedValueOnce({ rows: [mockOrder] })            // insert order
                .mockResolvedValueOnce({ rows: [{ price: 10 }] })       // precio menu 1 (insert item)
                .mockResolvedValueOnce(undefined)                        // insert order_item 1
                .mockResolvedValueOnce({ rows: [{ price: 15 }] })       // precio menu 2 (insert item)
                .mockResolvedValueOnce(undefined)                        // insert order_item 2
                .mockResolvedValueOnce(undefined)                        // COMMIT

            const items = [{ menuId: 1, quantity: 2 }, { menuId: 2, quantity: 1 }]
            const result = await ordersModel.createOrder({
                userId: 1,
                restaurantId: 1,
                reservationId: null,
                pickup: false,
                items
            })

            expect(client.query).toHaveBeenCalledWith('BEGIN')
            expect(client.query).toHaveBeenCalledWith('COMMIT')
            expect(result).toEqual(mockOrder)
            expect(client.release).toHaveBeenCalled()
        });

        it('createOrder throws if menu not found', async () => {
            const client = { query: jest.fn(), release: jest.fn() };
            pool.connect.mockResolvedValue(client);

            client.query
                .mockResolvedValueOnce()                     // BEGIN
                .mockResolvedValueOnce({ rows: [] });        // no price

            const items = [{ menuId: 1, quantity: 1 }];
            await expect(ordersModel.createOrder({ userId: 1, restaurantId: 1, items })).rejects.toThrow('Menu item 1 not found');
            expect(client.query).toHaveBeenCalledWith('ROLLBACK');
            expect(client.release).toHaveBeenCalled();
        });

        it('getAllOrders', async () => {
            const ordersWithItems = [{ ...mockOrder, items: [mockItem] }];
            pool.query.mockResolvedValue({ rows: ordersWithItems });
            const result = await ordersModel.getAllOrders();
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT o.*'));
            expect(result).toEqual(ordersWithItems);
        });

        it('updateOrder', async () => {
            const updated = { ...mockOrder, status: 'confirmed' };
            pool.query.mockResolvedValue({ rows: [updated] });
            const result = await ordersModel.updateOrder(1, { status: 'confirmed' });
            expect(pool.query).toHaveBeenCalledWith(
                `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING *`,
                ['confirmed', 1]
            );
            expect(result).toEqual(updated);
        });

        it('deleteOrder', async () => {
            pool.query.mockResolvedValue({});
            await ordersModel.deleteOrder(1);
            expect(pool.query).toHaveBeenCalledWith('DELETE FROM orders WHERE id = $1', [1]);
        });
    });
});