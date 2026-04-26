const getDb = require("../config/database")

async function initMongo() {
    const db = await getDb()

    console.log("Initializing MongoDB...")

    // ===== USERS =====
    await db.collection("users").createIndex(
        { keycloak_id: 1 },
        { unique: true }
    )

    await db.collection("users").createIndex(
        { keycloak_id: 1, email: 1 },
        { unique: true }
    )

    // ===== RESTAURANTS =====
    await db.collection("restaurants").createIndex(
        { name: 1 }
    )

    // ===== MENUS =====
    await db.collection("menus").createIndex(
        { restaurant_id: 1 }
    )

    // Para búsquedas (útil luego para Elastic también)
    await db.collection("menus").createIndex(
        { name: "text", description: "text" }
    )

    // ===== RESERVATIONS =====
    await db.collection("reservations").createIndex(
        { user_id: 1 }
    )

    await db.collection("reservations").createIndex(
        { restaurant_id: 1 }
    )

    await db.collection("reservations").createIndex(
        { reservation_date: 1 }
    )

    await db.collection("reservations").createIndex(
        { status: 1 }
    )

    // ===== ORDERS =====
    await db.collection("orders").createIndex(
        { user_id: 1 }
    )

    await db.collection("orders").createIndex(
        { restaurant_id: 1 }
    )

    await db.collection("orders").createIndex(
        { status: 1 }
    )

    await db.collection("orders").createIndex(
        { created_at: -1 }
    )

    console.log("MongoDB ready (indexes created)")
}

module.exports = initMongo