const DB_TYPE = process.env.DB_TYPE || "postgres";

class DAOFactory {
  static getUserDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const UserPostgresDAO = require("./postgres/UserPostgresDAO")
        return new UserPostgresDAO()

      case "mongo":
        const UserMongoDAO = require("./mongo/UserMongoDAO")
        return new UserMongoDAO()

      default:
        throw new Error("Unsupported database type");
    }
  }

  static getRestaurantDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const RestaurantPostgresDAO = require("./postgres/RestaurantPostgresDAO")
        return new RestaurantPostgresDAO()

      case "mongo":
        const RestaurantMongoDAO = require("./mongo/RestaurantMongoDAO")
        return new RestaurantMongoDAO()

      default:
        throw new Error("Unsupported database type")
    }
  }

  static getOrderDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const OrderPostgresDAO = require("./postgres/OrderPostgresDAO")
        return new OrderPostgresDAO()

      case "mongo":
        const OrderMongoDAO = require("./mongo/OrderMongoDAO")
        return new OrderMongoDAO()

      default:
        throw new Error("Unsupported database type")
    }

  }

  static getMenuDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const MenuPostgresDAO = require("./postgres/MenuPostgresDAO")
        return new MenuPostgresDAO()

      case "mongo":
        const MenuMongoDAO = require("./mongo/MenuMongoDAO")
        return new MenuMongoDAO()

      default:
        throw new Error("Unsupported database type")
    }
  }

  static getReservationDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const ReservationPostgresDAO = require("./postgres/ReservationPostgresDAO")
        return new ReservationPostgresDAO()

      case "mongo":
        const ReservationMongoDAO = require("./mongo/ReservationMongoDAO")
        return new ReservationMongoDAO()

      default:
        throw new Error("Unsupported database type")
    }
  }
}

module.exports = DAOFactory;