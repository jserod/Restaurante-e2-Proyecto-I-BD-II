const createMockElasticClient = () => ({
    search: jest.fn(),
    bulk: jest.fn(),
    indices: {
        exists: jest.fn().mockResolvedValue(true)
    }
})

const createMockElasticModule = () => ({
    client: createMockElasticClient(),
    INDEX: "products",
    ensureIndex: jest.fn().mockResolvedValue()
})

module.exports = { createMockElasticClient, createMockElasticModule }