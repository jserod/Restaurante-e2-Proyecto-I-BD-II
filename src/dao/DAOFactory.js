// const UserMongoDAO = require("./mongo/UserMongoDAO");

const DB_TYPE = process.env.DB_TYPE || "postgres";

class DAOFactory {
  static getUserDAO(db) {
    switch (DB_TYPE) {
      case "postgres":
        return new (require("./postgres/UserPostgresDAO"))(db);

      // case "mongo":
      //   return new UserMongoDAO();

      default:
        throw new Error("Unsupported database type");
    }
  }

  static getRestaurantDAO(db) {
    switch (DB_TYPE) {
      case "postgres":
        return new (require("./postgres/RestaurantPostgresDAO"))(db)

      default:
        throw new Error("Unsupported database type")
    }
  }
}

module.exports = DAOFactory;