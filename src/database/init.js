const DB_TYPE = process.env.DB_TYPE || "postgres"

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