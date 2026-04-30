// Configuración global para todos los tests
jest.setTimeout(10000) // 10 segundos max por test

// Silenciar logs durante tests
console.log = jest.fn()
console.error = jest.fn()