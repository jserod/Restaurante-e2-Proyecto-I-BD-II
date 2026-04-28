const IProductDAO = require("../interfaces/IProductDAO")
const { ObjectId } = require("mongodb")
const getDb = require("../../config/database")

class ProductMongoDAO extends IProductDAO {

    async getCollection() {
        const db = await getDb()
        return db.collection("menus")
    }

    async getAll() {
        const col = await this.getCollection()
        const menus = await col.find().toArray()
        const products = []
        for (const menu of menus) {
            if (menu.products && Array.isArray(menu.products)) {
                for (const p of menu.products) {
                    products.push({
                        ...p,
                        menu_id: menu._id.toString(),
                        menu_name: menu.name
                    })
                }
            }
        }
        return products
    }

    async getById(id) {
        const col = await this.getCollection()
        const menu = await col.findOne(
            { "products.product_id": id },
            { projection: { products: { $elemMatch: { product_id: id } }, name: 1, restaurant_id: 1 } }
        )
        if (!menu || !menu.products || menu.products.length === 0) return null
        return {
            ...menu.products[0],
            menu_id: menu._id.toString(),
            menu_name: menu.name
        }
    }

    async create({ menuId, name, description, price, isAvailable }) {
        const col = await this.getCollection()
        const productId = new ObjectId().toString()

        const product = {
            product_id: productId,
            name,
            description: description || null,
            price,
            is_available: isAvailable !== false,
            created_at: new Date()
        }

        await col.updateOne(
            { _id: new ObjectId(menuId) },
            {
                $push: { products: product },
                $set: { updated_at: new Date() }
            }
        )

        return { ...product, menu_id: menuId }
    }

    async update(id, data) {
        const col = await this.getCollection()
        const setFields = {}

        if (data.name !== undefined) setFields["products.$.name"] = data.name
        if (data.description !== undefined) setFields["products.$.description"] = data.description
        if (data.price !== undefined) setFields["products.$.price"] = data.price
        if (data.isAvailable !== undefined) setFields["products.$.is_available"] = data.isAvailable

        if (Object.keys(setFields).length === 0) {
            throw new Error("No fields to update")
        }

        setFields["products.$.updated_at"] = new Date()
        setFields["updated_at"] = new Date()

        await col.updateOne(
            { "products.product_id": id },
            { $set: setFields }
        )

        return await this.getById(id)
    }

    async delete(id) {
        const col = await this.getCollection()
        await col.updateOne(
            { "products.product_id": id },
            {
                $pull: { products: { product_id: id } },
                $set: { updated_at: new Date() }
            }
        )
    }
}

module.exports = ProductMongoDAO