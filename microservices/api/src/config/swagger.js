/**
 * @fileoverview Configuración Swagger. Escanea ../routes/*.js para generar docs automáticamente.
 */

const path = require("path")
const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Restaurant API",
            version: "1.0.0",
            description: "API REST para gestión de reservas en restaurantes"
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [path.join(__dirname, "../routes/*.js")]
}

module.exports = swaggerJsdoc(options)