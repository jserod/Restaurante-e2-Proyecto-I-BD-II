const UserPostgresDAO = require("./postgres/UserPostgresDAO")
// const UserMongoDAO = require("../dao/mongo/UserMongoDAO") // después

const DB_TYPE = process.env.DB_TYPE || "postgres"

class DAOFactory {
  static getUserDAO() {
    if (DB_TYPE === "mongo") {
      // return new UserMongoDAO()
      throw new Error("MongoDAO not implemented yet")
    }

    return new UserPostgresDAO()
  }
}

module.exports = DAOFactory