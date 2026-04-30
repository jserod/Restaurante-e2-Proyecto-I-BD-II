const createMockRedisClient = () => ({
    get: jest.fn(),
    setEx: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn(),
    del: jest.fn()
})

const createMockRedisModule = () => ({
    connectRedis: jest.fn(),
    client: createMockRedisClient()
})

module.exports = { createMockRedisClient, createMockRedisModule }