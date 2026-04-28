const { client, INDEX } = require("./elastic")
const productDataSource = require("./productDataSource")

async function searchByText(req, res, next) {
    try {
        const { q } = req.query
        if (!q) {
            return res.status(400).json({ error: "Query parameter 'q' is required" })
        }

        const result = await client.search({
            index: INDEX,
            query: {
                multi_match: {
                    query: q,
                    fields: ["name", "description"],
                    fuzziness: "AUTO"
                }
            }
        })

        res.json(result.hits.hits.map(h => h._source))
    } catch (error) {
        next(error)
    }
}

async function searchByCategory(req, res, next) {
    try {
        const { categoria } = req.params

        const result = await client.search({
            index: INDEX,
            query: {
                term: { category: categoria.toLowerCase() }
            }
        })

        res.json(result.hits.hits.map(h => h._source))
    } catch (error) {
        next(error)
    }
}

async function reindex(req, res, next) {
    try {
        const products = await productDataSource.getProducts()

        if (products.length === 0) {
            return res.json({ message: "No products to index", indexed: 0 })
        }

        const operations = products.flatMap(product => [
            { index: { _index: INDEX, _id: product.id } },
            product
        ])

        const result = await client.bulk({ operations })

        res.json({
            message: "Reindex completed",
            indexed: products.length,
            errors: result.errors
        })

    } catch (error) {
        next(error)
    }
}

module.exports = { searchByText, searchByCategory, reindex }