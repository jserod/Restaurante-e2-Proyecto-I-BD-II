/**
 * @fileoverview Inicialización de MongoDB.
 * Crea índices optimizados para consultas frecuentes sobre documentos embebidos.
 */

const getDb = require("../config/database")

/**
 * Crea índices en todas las colecciones necesarias.
 * @returns {Promise<void>}
 */
async function initMongo() {
    const db = await getDb()

    console.log("Initializing MongoDB...")

    await db.collection("users").createIndex({ keycloak_id: 1 }, { unique: true })
    await db.collection("users").createIndex({ email: 1 })

    await db.collection("restaurants").createIndex({ name: 1 })
    // Índices para buscar menus/productos embebidos
    await db.collection("restaurants").createIndex({ "menus._id": 1 })
    await db.collection("restaurants").createIndex({ "menus.name": "text", "menus.description": "text" })
    await db.collection("restaurants").createIndex({ "menus.products.name": 1 })
    await db.collection("restaurants").createIndex({ "menus.products.tags": 1 })
    await db.collection("restaurants").createIndex({ "menus.products.product_id": 1 })

    await db.collection("reservations").createIndex({ user_id: 1 })
    await db.collection("reservations").createIndex({ restaurant_id: 1 })
    await db.collection("reservations").createIndex({ reservation_date: 1 })
    await db.collection("reservations").createIndex({ status: 1 })

    await db.collection("orders").createIndex({ user_id: 1 })
    await db.collection("orders").createIndex({ restaurant_id: 1 })
    await db.collection("orders").createIndex({ status: 1 })
    await db.collection("orders").createIndex({ created_at: -1 })

    console.log("MongoDB ready (indexes created)")
}

module.exports = initMongo