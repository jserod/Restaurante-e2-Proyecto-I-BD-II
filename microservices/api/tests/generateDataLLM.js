require("dotenv").config({ path: "../../.env" })
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

    const parsed = JSON.parse(jsonMatch[0])

    // Si devuelve un objeto en vez de array, buscar el primer array dentro
    if (!Array.isArray(parsed)) {
        const firstArray = Object.values(parsed).find(v => Array.isArray(v))
        if (firstArray) return firstArray
        throw new Error("La respuesta no contiene un array válido")
    }

    return parsed
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

async function generateMenus(restaurantName) {
    console.log(`  Generando menús para ${restaurantName}...`)
    return await generateWithOllama(`
        Genera un array JSON con 3 menús para el restaurante "${restaurantName}".
        Los menús son secciones del restaurante como "Desayunos", "Almuerzos", "Cenas", "Bebidas", "Postres".
        Cada menú debe tener estos campos exactos:
        {
            "name": "nombre de la sección del menú",
            "description": "descripción breve de la sección"
        }
        Devuelve solo el array JSON.
    `)
}

async function generateProducts(menuName, restaurantName) {
    console.log(`    Generando productos para menú "${menuName}"...`)
    return await generateWithOllama(`
        Genera un array JSON con 4 productos para la sección "${menuName}" del restaurante "${restaurantName}".
        Cada producto debe tener estos campos exactos:
        {
            "name": "nombre del producto",
            "description": "descripción del producto de 1 oración",
            "price": número entre 2000 y 15000 (colones costarricenses, sin símbolo),
            "is_available": true
        }
        Devuelve solo el array JSON.
    `)
}

// =====================
// SEED POSTGRES
// =====================
async function seedPostgres(restaurants, menusPerRestaurant, productsPerMenu) {
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
                console.log(`  Restaurante "${r.name}" ya existe, saltando...`)
                continue
            }

            const restaurantId = result.rows[0].id
            console.log(`  ✓ Restaurante: ${r.name} (id: ${restaurantId})`)

            const menus = menusPerRestaurant[i]
            for (let j = 0; j < menus.length; j++) {
                const m = menus[j]

                const menuResult = await pool.query(
                    `INSERT INTO menus (restaurant_id, name, description)
                     VALUES ($1, $2, $3)
                     RETURNING id`,
                    [restaurantId, m.name, m.description]
                )

                const menuId = menuResult.rows[0].id
                console.log(`    ✓ Menú: ${m.name} (id: ${menuId})`)

                const products = productsPerMenu[i][j]
                for (const p of products) {
                    await pool.query(
                        `INSERT INTO products (menu_id, name, description, price, is_available)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [menuId, p.name, p.description, p.price, p.is_available !== false]
                    )
                    console.log(`      ✓ Producto: ${p.name} (₡${p.price})`)
                }
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
async function seedMongo(restaurants, menusPerRestaurant, productsPerMenu) {
    const { MongoClient, ObjectId } = require("mongodb")
    const mongoUri = "mongodb://localhost:27017"
    const client = new MongoClient(mongoUri)

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
            console.log(`  ✓ Restaurante: ${r.name} (id: ${restaurantId})`)

            const menus = menusPerRestaurant[i]
            for (let j = 0; j < menus.length; j++) {
                const m = menus[j]

                // Crear los productos embebidos dentro del menú
                const products = productsPerMenu[i][j]
                const embeddedProducts = products.map(p => ({
                    product_id: new ObjectId().toString(),
                    name: p.name,
                    description: p.description || "Producto sin descripción",
                    price: p.price,
                    is_available: p.is_available !== false,
                    created_at: new Date()
                }))

                const menuResult = await db.collection("menus").insertOne({
                    restaurant_id: restaurantId,
                    name: m.name,
                    description: m.description,
                    products: embeddedProducts,  // ← embebidos aquí
                    created_at: new Date()
                })

                const menuId = menuResult.insertedId
                console.log(`    ✓ Menú: ${m.name} (id: ${menuId}) con ${embeddedProducts.length} productos`)
                for (const p of embeddedProducts) {
                    console.log(`      ✓ Producto: ${p.name} (₡${p.price})`)
                }
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
        const healthCheck = await ollama.list()
        console.log(`✓ Ollama conectado, modelos disponibles: ${healthCheck.models.map(m => m.name).join(", ")}\n`)
    } catch (err) {
        console.error("❌ No se puede conectar a Ollama. ¿Está corriendo?")
        process.exit(1)
    }

    try {
        const restaurants = await generateRestaurants()
        console.log(`✓ ${restaurants.length} restaurantes generados\n`)

        const menusPerRestaurant = []
        const productsPerMenu = []

        for (let i = 0; i < restaurants.length; i++) {
            const menus = await generateMenus(restaurants[i].name)
            menusPerRestaurant.push(menus)

            const productsByMenu = []
            for (const menu of menus) {
                const products = await generateProducts(menu.name, restaurants[i].name)
                productsByMenu.push(products)
            }
            productsPerMenu.push(productsByMenu)
        }

        if (DB_TYPE === "postgres") {
            await seedPostgres(restaurants, menusPerRestaurant, productsPerMenu)
        } else if (DB_TYPE === "mongo") {
            await seedMongo(restaurants, menusPerRestaurant, productsPerMenu)
        } else {
            throw new Error(`DB_TYPE no soportado: ${DB_TYPE}`)
        }

        const totalMenus = menusPerRestaurant.reduce((acc, m) => acc + m.length, 0)
        const totalProducts = productsPerMenu.reduce((acc, r) => acc + r.reduce((a, m) => a + m.length, 0), 0)

        console.log(`\n🎉 Proceso completado exitosamente`)
        console.log(`   ${restaurants.length} restaurantes`)
        console.log(`   ${totalMenus} menús`)
        console.log(`   ${totalProducts} productos`)

    } catch (error) {
        console.error("\n❌ Error durante el seed:", error.message)
        process.exit(1)
    }
}

main()