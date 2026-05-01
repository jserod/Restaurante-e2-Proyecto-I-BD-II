function createMockRes() {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
}

function createMockReq(overrides = {}) {
    return {
        params: {},
        body: {},
        query: {},
        user: {},
        kauth: { grant: { access_token: { content: { sub: "kc-123", email: "test@test.com", preferred_username: "testuser" } } } },
        ...overrides
    }
}

function createMockNext() {
    return jest.fn()
}

module.exports = { createMockReq, createMockRes, createMockNext }