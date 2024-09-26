module.exports = (app) => {
  const router = require('express').Router()
  const authCookie = require('../middlewares/auth-customer-cookie.js')
  const controller = require('../controllers/customer/assistant-controller.js')

  router.get('/', [authCookie.verifyCustomerCookie], controller.findAll)
  router.post('/response', [authCookie.verifyCustomerCookie], controller.assistantResponse)

  app.use('/api/customer/assistants', router)
}
