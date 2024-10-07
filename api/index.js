require('dotenv').config()
const { wss, authenticate } = require('./src/services/websocket-service')
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const app = express()
const IORedis = require('ioredis')
const { sessionConfig, redisClient } = require('./src/config/session-config')
const userAgentMiddleware = require('./src/middlewares/user-agent')
const exposeServiceMiddleware = require('./src/middlewares/expose-services')

const subscriberClient = new IORedis(process.env.REDIS_URL)

const eventsPath = './src/events/'

fs.readdirSync(eventsPath).forEach(function (file) {
  require(eventsPath + file).handleEvent(redisClient, subscriberClient)
})

app.use((req, res, next) => {
  req.redisClient = redisClient
  next()
})

app.use(sessionConfig)

app.use(cors({ origin: [process.env.API_URL], credentials: true }))

app.use(express.json({ limit: '10mb', extended: true }))
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }))

app.use(userAgentMiddleware)
app.use(...Object.values(exposeServiceMiddleware))

const routePath = './src/routes/'

fs.readdirSync(routePath).forEach(function (file) {
  require(routePath + file)(app)
})

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, () => {
  console.log(`El servidor está corriendo en el puerto ${PORT}.`)
})

server.on('upgrade', (req, socket, head) => {
  authenticate(req, (callback, auth, statusCode, message) => {
    if (!auth) {
      socket.write(`HTTP/1.1 ${statusCode} ${message}\r\n\r\n`)
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })
})
