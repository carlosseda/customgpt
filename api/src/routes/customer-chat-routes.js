module.exports = (app) => {
  const router = require('express').Router()
  const authCookie = require('../middlewares/auth-customer-cookie.js')
  const controller = require('../controllers/customer/chat-controller.js')

  router.get('/last', [authCookie.verifyCustomerCookie], controller.findLast)
  router.get('/', [authCookie.verifyCustomerCookie], controller.findAll)
  router.get('/:threadId', [authCookie.verifyCustomerCookie], controller.findOne)

  app.use('/api/customer/chats', router)
}
