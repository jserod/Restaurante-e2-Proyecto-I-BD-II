const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Search Service API",
            version: "1.0.0",
            description: "Microservicio de búsqueda con ElasticSearch"
        },
        servers: [
            {
                url: "http://localhost:3001"
            }
        ]
    },
    apis: ["src/**/*.js"] 
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec