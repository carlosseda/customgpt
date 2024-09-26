module.exports = (app) => {
  const router = require('express').Router()
  const controller = require('../controllers/customer/menu-controller.js')
  const authCookie = require('../middlewares/auth-customer-cookie.js')

  router.get('/display/:name',  [authCookie.verifyCustomerCookie], controller.getMenuItems)

  app.use('/api/customer/menus', router)
}
