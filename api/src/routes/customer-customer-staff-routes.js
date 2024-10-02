module.exports = (app) => {
  const router = require('express').Router()
  const controller = require('../controllers/customer/customer-staff-controller.js')
  const authCookie = require('../middlewares/auth-customer-cookie.js')

  router.get('/findOne',  [authCookie.verifyCustomerCookie], controller.findOne)

  app.use('/api/customer/customer-staff', router)
}
