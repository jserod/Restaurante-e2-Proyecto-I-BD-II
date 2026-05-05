/**
 * @fileoverview Inicialización de PostgreSQL.
 * Crea todas las tablas con sus relaciones, constraints e índices implícitos (PRIMARY KEY, FOREIGN KEY).
 */

const pool = require("../config/database")

/**
 * Ejecuta el script para crear tablas si no existen.
 * @returns {Promise<void>}
 * @throws {Error} Si falla la ejecución del SQL
 */
async function initPostgres() {
    try {
        console.log("Initializing database...")

        await pool.query(`

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                keycloak_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'client',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS restaurants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                address TEXT,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS menus (
                id SERIAL PRIMARY KEY,
                restaurant_id INTEGER NOT NULL
                    REFERENCES restaurants(id)
                    ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                menu_id INTEGER NOT NULL
                    REFERENCES menus(id)
                    ON DELETE CASCADE,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                price NUMERIC(10,2) NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS reservations (
                id SERIAL PRIMARY KEY,
                restaurant_id INTEGER NOT NULL
                    REFERENCES restaurants(id)
                    ON DELETE CASCADE,
                user_id INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,
                party_size INTEGER NOT NULL DEFAULT 1,
                reservation_date TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                reservation_id INTEGER
                    REFERENCES reservations(id)
                    ON DELETE SET NULL,
                user_id INTEGER NOT NULL
                    REFERENCES users(id)
                    ON DELETE CASCADE,
                restaurant_id INTEGER NOT NULL
                    REFERENCES restaurants(id)
                    ON DELETE CASCADE,
                pickup BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'pending',
                total NUMERIC(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL
                    REFERENCES orders(id)
                    ON DELETE CASCADE,
                product_id INTEGER NOT NULL
                    REFERENCES menus(id)
                    ON DELETE CASCADE,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price NUMERIC(10,2) NOT NULL
            );

        `)

        console.log("Database tables ready")

    } catch (error) {
        console.error("Database initialization error:", error)
        throw error
    }
}

module.exports = initPostgres