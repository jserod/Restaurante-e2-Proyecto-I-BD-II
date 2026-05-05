/**
 * @fileoverview Interfaz abstracta para DAO de reservaciones.
 * Define el contrato que deben implementar ReservationPostgresDAO y ReservationMongoDAO.
 */

class IReservationDAO {
    getAll() {
        throw new Error("Not implemented")
    }

    getById(id) {
        throw new Error("Not implemented")
    }

    create(data) {
        throw new Error("Not implemented")
    }

    update(id, data) {
        throw new Error("Not implemented")
    }

    cancel(id) {
        throw new Error("Not implemented")
    }
}

module.exports = IReservationDAO