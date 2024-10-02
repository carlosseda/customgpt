module.exports = (app) => {
  const router = require('express').Router()
  const controller = require('../controllers/customer/customer-controller.js')
  const authCookie = require('../middlewares/auth-customer-cookie.js')

  router.get('/',  [authCookie.verifyCustomerCookie], controller.findOne)

  app.use('/api/customer/welcome', router)
}
