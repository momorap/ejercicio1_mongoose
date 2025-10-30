const logger = (req, res, next) => {
    console.log(`Petición recibida: ${req.method} en la ruta ${req.originalUrl}`)

    next()
}

module.exports = logger