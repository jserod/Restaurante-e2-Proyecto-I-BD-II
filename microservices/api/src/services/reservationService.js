const DAOFactory = require("../dao/DAOFactory")
const reservationDAO = DAOFactory.getReservationDAO()

class ReservationService {

    async getAll() {
        return reservationDAO.getAll()
    }

    async getById(id) {
        return reservationDAO.getById(id)
    }

    async create(data) {
        return reservationDAO.create(data)
    }

    async update(id, data) {
        return reservationDAO.update(id, data)
    }

    async cancel(id, userId) {
        const reservation = await reservationDAO.getById(id)

        if (!reservation) {
            throw new Error("NOT_FOUND")
        }

        if (reservation.user_id !== userId) {
            throw new Error("FORBIDDEN")
        }

        return reservationDAO.cancel(id)
    }
}

module.exports = new ReservationService()