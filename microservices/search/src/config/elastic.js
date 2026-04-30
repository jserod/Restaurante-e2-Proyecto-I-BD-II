const { Client } = require("@elastic/elasticsearch")

const client = new Client({
    node: process.env.ELASTIC_URL || "http://elasticsearch:9200"
})

const INDEX = "products"

async function ensureIndex() {
    const exists = await client.indices.exists({ index: INDEX })
    if (!exists) {
        await client.indices.create({
            index: INDEX,
            mappings: {
                properties: {
                    id: { type: "keyword" },
                    name: { type: "text" },
                    description: { type: "text" },
                    price: { type: "float" },
                    isAvailable: { type: "boolean" },
                    category: { type: "keyword" },
                    menuId: { type: "keyword" },
                    restaurantId: { type: "keyword" }
                }
            }
        })
        console.log("Index 'products' created")
    }
}

module.exports = { client, INDEX, ensureIndex }