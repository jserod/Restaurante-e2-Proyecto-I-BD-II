const DAOFactory = require("../dao/DAOFactory")
const reservationDAO = DAOFactory.getReservationDAO()
const { NotFoundError, ForbiddenError } = require("../errors")

class ReservationService {
    async getAll() {
        return reservationDAO.getAll()
    }

    async getById(id) {
        const reservation = await reservationDAO.getById(id)
        if (!reservation) {
            throw new NotFoundError("Reservation not found")
        }
        return reservation
    }

    async create(data) {
        return reservationDAO.create(data)
    }

    async update(id, data) {
        await this.getById(id) // verifica que exista
        return reservationDAO.update(id, data)
    }

    async cancel(id, userId) {
        const reservation = await reservationDAO.getById(id)
        if (!reservation) {
            throw new NotFoundError("Reservation not found")
        }
        if (reservation.user_id !== userId) {
            throw new ForbiddenError("You can only cancel your own reservations")
        }
        return reservationDAO.cancel(id)
    }
}

module.exports = new ReservationService()