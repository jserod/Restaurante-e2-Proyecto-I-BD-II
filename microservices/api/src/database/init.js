/**
 * @fileoverview Punto de entrada para inicializar la base de datos según DB_TYPE.
 * Delega a initPostgres o initMongo según la configuración de entorno.
 */

const DB_TYPE = process.env.DB_TYPE || "postgres"

/**
 * Inicializa la base de datos correspondiente (PostgreSQL o MongoDB).
 * @returns {Promise<void>}
 * @throws {Error} Si DB_TYPE no es soportado
 */
async function initDatabase() {
    console.log(`Initializing database (${DB_TYPE})...`)

    switch (DB_TYPE) {
        case "postgres": {
            const initPostgres = require("./initPostgres")
            await initPostgres()
            break
        }

        case "mongo": {
            const initMongo = require("./initMongo")
            await initMongo()
            break
        }

        default:
            throw new Error("Unsupported DB_TYPE")
    }

    console.log("Database ready")
}

module.exports = initDatabase