const WebSocket = require('ws')
const { sessionConfig } = require('../config/session-config')
const wss = new WebSocket.Server({ noServer: true })

const broadcast = (channel, data, customerStaffId = null) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      if (customerStaffId === null || client.customerStaffId === customerStaffId) {
        client.send(JSON.stringify({ channel, data }))
      }
    }
  })
}

const authenticate = (req, callback) => {
  sessionConfig(req, {}, (err) => {
    if (err) {
      callback(err)
      return
    }

    if (req.session && req.session.customer.customerStaffId) {
      callback(null, true)
    } else {
      callback(null, false, 401, 'Unauthorized')
    }
  })
}

wss.on('connection', (ws, req) => {
  const customerStaffId = req.session.customer.customerStaffId
  ws.customerStaffId = customerStaffId

  ws.on('message', (message) => {
    // Manejar mensajes aquí
  })
})

module.exports = { broadcast, wss, authenticate }
