function createMockPool() {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn()
    }

    const mockPool = {
        query: jest.fn(),
        connect: jest.fn().mockResolvedValue(mockClient)
    }

    return { mockPool, mockClient }
}

module.exports = { createMockPool }