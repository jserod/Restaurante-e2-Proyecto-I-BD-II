require("dotenv").config()
const { Ollama } = require("ollama")

const DB_TYPE = process.env.DB_TYPE || "postgres"
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"

const ollama = new Ollama({ host: OLLAMA_HOST })

// =====================
// GENERADOR CON OLLAMA
// =====================
async function generateWithOllama(prompt) {
    const response = await ollama.chat({
        model: OLLAMA_MODEL,
        messages: [
            {
                role: "system",
                content: "Eres un generador de datos de prueba para un sistema de restaurantes. Responde SOLO con JSON válido, sin explicaciones ni texto adicional."
            },
            {
                role: "user",
                content: prompt
            }
        ]
    })

    const text = response.message.content.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No se encontró JSON válido en la respuesta")
    return JSON.parse(jsonMatch[0])
}

async function generateRestaurants() {
    console.log("Generando restaurantes con Ollama...")
    return await generateWithOllama(`
        Genera un array JSON con 5 restaurantes costarricenses realistas.
        Cada restaurante debe tener estos campos exactos:
        {
            "name": "nombre del restaurante",
            "description": "descripción del restaurante de 1-2 oraciones",
            "address": "dirección en Costa Rica (ciudad, provincia)"
        }
        Devuelve solo el array JSON.
    `)
}

async function generateMenus(restaurantId, restaurantName) {
    console.log(`Generando menús para ${restaurantName}...`)
    return await generateWithOllama(`
        Genera un array JSON con 4 menús para el restaurante "${restaurantName}".
        Cada menú debe tener estos campos exactos:
        {
            "name": "nombre del menú",
            "description": "descripción breve del menú",
            "price": número entre 2000 y 15000 (colones costarricenses),
            "category": una de estas categorías: "entrada", "plato principal", "postre", "bebida"
        }
        Devuelve solo el array JSON.
    `)
}

// =====================
// SEED POSTGRES
// =====================
async function seedPostgres(restaurants, menusPerRestaurant) {
    const { Pool } = require("pg")
    const pool = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    })

    try {
        console.log("\nInsertando datos en PostgreSQL...")

        for (let i = 0; i < restaurants.length; i++) {
            const r = restaurants[i]
            const result = await pool.query(
                `INSERT INTO restaurants (name, description, address)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING
                 RETURNING id`,
                [r.name, r.description, r.address]
            )

            if (!result.rows[0]) {
                console.log(`  Restaurant "${r.name}" ya existe, saltando...`)
                continue
            }

            const restaurantId = result.rows[0].id
            console.log(`  ✓ Restaurante creado: ${r.name} (id: ${restaurantId})`)

            const menus = menusPerRestaurant[i]
            for (const m of menus) {
                await pool.query(
                    `INSERT INTO menus (restaurant_id, name, description, price, category)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT DO NOTHING`,
                    [restaurantId, m.name, m.description, m.price, m.category]
                )
                console.log(`    ✓ Menú creado: ${m.name}`)
            }
        }

        console.log("\n✅ Seed de PostgreSQL completado")
    } finally {
        await pool.end()
    }
}

// =====================
// SEED MONGO
// =====================
async function seedMongo(restaurants, menusPerRestaurant) {
    const { MongoClient, ObjectId } = require("mongodb")
    const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017")

    try {
        await client.connect()
        const db = client.db(process.env.MONGO_DB_NAME || "restaurant")

        console.log("\nInsertando datos en MongoDB...")

        for (let i = 0; i < restaurants.length; i++) {
            const r = restaurants[i]

            const existing = await db.collection("restaurants").findOne({ name: r.name })
            if (existing) {
                console.log(`  Restaurante "${r.name}" ya existe, saltando...`)
                continue
            }

            const restaurantResult = await db.collection("restaurants").insertOne({
                name: r.name,
                description: r.description,
                address: r.address,
                created_at: new Date()
            })

            const restaurantId = restaurantResult.insertedId
            console.log(`  ✓ Restaurante creado: ${r.name} (id: ${restaurantId})`)

            const menus = menusPerRestaurant[i]
            for (const m of menus) {
                await db.collection("menus").insertOne({
                    restaurant_id: restaurantId,
                    name: m.name,
                    description: m.description || "Producto sin descripción",
                    price: m.price,
                    category: (m.category || "general").toLowerCase(),
                    created_at: new Date()
                })
                console.log(`    ✓ Menú creado: ${m.name}`)
            }
        }

        console.log("\n✅ Seed de MongoDB completado")
    } finally {
        await client.close()
    }
}

// =====================
// MAIN
// =====================
async function main() {
    console.log(`\n🚀 Iniciando generación de datos con Ollama (modelo: ${OLLAMA_MODEL})`)
    console.log(`📦 Base de datos: ${DB_TYPE}\n`)

    try {
        // Verificar que Ollama esté corriendo
        const { default: fetch } = await import("node-fetch").catch(() => ({ default: global.fetch }))
        const healthCheck = await ollama.list()
        console.log(`✓ Ollama conectado, modelos disponibles: ${healthCheck.models.map(m => m.name).join(", ")}\n`)
    } catch (err) {
        console.error("❌ No se puede conectar a Ollama. ¿Está corriendo? Corré: ollama serve")
        process.exit(1)
    }

    try {
        // Generar restaurantes
        const restaurants = await generateRestaurants()
        console.log(`✓ ${restaurants.length} restaurantes generados`)

        // Generar menús para cada restaurante
        const menusPerRestaurant = []
        for (const restaurant of restaurants) {
            const menus = await generateMenus(null, restaurant.name)
            menusPerRestaurant.push(menus)
            console.log(`✓ ${menus.length} menús generados para ${restaurant.name}`)
        }

        // Insertar según DB_TYPE
        if (DB_TYPE === "postgres") {
            await seedPostgres(restaurants, menusPerRestaurant)
        } else if (DB_TYPE === "mongo") {
            await seedMongo(restaurants, menusPerRestaurant)
        } else {
            throw new Error(`DB_TYPE no soportado: ${DB_TYPE}`)
        }

        console.log("\n🎉 Proceso completado exitosamente")
        console.log(`   ${restaurants.length} restaurantes insertados`)
        console.log(`   ${restaurants.length * 4} menús insertados aproximadamente`)

    } catch (error) {
        console.error("\n❌ Error durante el seed:", error.message)
        process.exit(1)
    }
}

main()