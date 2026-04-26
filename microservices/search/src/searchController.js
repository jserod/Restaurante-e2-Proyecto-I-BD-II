const { client, INDEX } = require("./elastic")
const menuDataSource = require("./menuDataSource")

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
                    fields: ["name", "description", "category"],
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
        const menus = await menuDataSource.getMenus()

        if (menus.length === 0) {
            return res.json({ message: "No menus to index", indexed: 0 })
        }

        const operations = menus.flatMap(menu => [
            { index: { _index: INDEX, _id: menu.id } },
            menu
        ])

        const result = await client.bulk({ operations })

        res.json({
            message: "Reindex completed",
            indexed: menus.length,
            errors: result.errors
        })

    } catch (error) {
        next(error)
    }
}

module.exports = { searchByText, searchByCategory, reindex }