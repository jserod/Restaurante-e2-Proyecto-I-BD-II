/**
 * @fileoverview Fábrica de DAOs que implementa el patrón Abstract Factory.
 * Permite cambiar entre PostgreSQL y MongoDB sin modificar el código de negocio.
 * La selección se determina por la variable de entorno DB_TYPE.
 */

const DB_TYPE = process.env.DB_TYPE || "postgres";

class DAOFactory {

  /**
   * Retorna la implementación de IUserDAO según DB_TYPE.
   * @returns {import("../interfaces/IUserDAO")} Instancia de UserDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
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

  /**
   * Retorna la implementación de IRestaurantDAO según DB_TYPE.
   * @returns {import("../interfaces/IRestaurantDAO")} Instancia de RestaurantDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
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

  /**
   * Retorna la implementación de IOrderDAO según DB_TYPE.
   * @returns {import("../interfaces/IOrderDAO")} Instancia de OrderDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
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

  /**
   * Retorna la implementación de IMenuDAO según DB_TYPE.
   * @returns {import("../interfaces/IMenuDAO")} Instancia de MenuDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
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

  /**
   * Retorna la implementación de IReservationDAO según DB_TYPE.
   * @returns {import("../interfaces/IReservationDAO")} Instancia de ReservationDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
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

  /**
   * Retorna la implementación de IProductDAO según DB_TYPE.
   * @returns {import("../interfaces/IProductDAO")} Instancia de ProductDAO
   * @throws {Error} Si DB_TYPE no es soportado
   */
  static getProductDAO() {
    switch (DB_TYPE) {
      case "postgres":
        const ProductPostgresDAO = require("./postgres/ProductPostgresDAO")
        return new ProductPostgresDAO()

      case "mongo":
        const ProductMongoDAO = require("./mongo/ProductMongoDAO")
        return new ProductMongoDAO()

      default:
        throw new Error("Unsupported database type")
    }
  }
}

module.exports = DAOFactory;