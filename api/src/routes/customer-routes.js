module.exports = (app) => {
  const router = require('express').Router()
  const controller = require('../controllers/customer/route-controller.js')
  const authCookie = require('../middlewares/auth-customer-cookie.js')

  router.post('/', [authCookie.verifyCustomerCookie], controller.findAll)

  app.use('/api/customer/routes', router)
}
