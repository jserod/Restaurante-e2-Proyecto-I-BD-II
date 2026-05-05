function createMockCollection() {
    return {
        find: jest.fn().mockReturnThis(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn(),
        aggregate: jest.fn().mockReturnThis()
    }
}

function createMockDb(collection) {
    return {
        collection: jest.fn().mockReturnValue(collection)
    }
}

function createMockGetDb(db) {
    return jest.fn().mockResolvedValue(db)
}

module.exports = { createMockCollection, createMockDb, createMockGetDb }