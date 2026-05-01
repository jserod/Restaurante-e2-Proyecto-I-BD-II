const http = require("http")
const EventEmitter = require("events")

function mockHttpResponse({ status = 200, body = "" }) {
    http.request = jest.fn((options, callback) => {
        const res = new EventEmitter()
        res.statusCode = status

        const req = new EventEmitter()
        req.write = jest.fn()
        req.end = jest.fn(() => {
            callback(res)

            if (body) {
                res.emit("data", body)
            }
            res.emit("end")
        })

        req.on = jest.fn()

        return req
    })
}

module.exports = { mockHttpResponse }