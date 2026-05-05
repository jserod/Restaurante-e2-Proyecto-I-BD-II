/**
 * @fileoverview Jerarquía de errores personalizados para la API.
 * Extiende Error con statusCode HTTP para manejo en middleware de errores.
 */

/** Error base con código de estado HTTP. */
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message)
        this.statusCode = statusCode
    }
}

/** Error 400 - Solicitud malformada o datos inválidos. */
class BadRequestError extends AppError {
    constructor(message = "Bad request") {
        super(message, 400)
    }
}

/** Error 401 - No autenticado o token inválido. */
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401)
    }
}

/** Error 403 - Autenticado pero sin permisos suficientes. */
class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403)
    }
}

/** Error 404 - Recurso no encontrado. */
class NotFoundError extends AppError {
    constructor(message = "Not found") {
        super(message, 404)
    }
}

/** Error 409 - Conflicto de estado (ej: duplicado). */
class ConflictError extends AppError {
    constructor(message = "Conflict") {
        super(message, 409)
    }
}

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
}