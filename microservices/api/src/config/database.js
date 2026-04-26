const DB_TYPE = process.env.DB_TYPE || "postgres"

let dbInstance

switch (DB_TYPE) {

  case "postgres": {
    const { Pool } = require("pg")

    dbInstance = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    break
  }

  case "mongo": {
    const { MongoClient } = require("mongodb")
    const client = new MongoClient(process.env.MONGO_URI)

    dbInstance = async () => {
      if (!client.topology || !client.topology.isConnected()) {
        await client.connect()
      }
      return client.db(process.env.MONGO_DB_NAME)
    }

    break
  }

  default:
    throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}`)
}

module.exports = dbInstance