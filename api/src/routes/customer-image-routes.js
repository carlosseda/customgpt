module.exports = (app) => {
  const router = require('express').Router()
  const authCookie = require('../middlewares/auth-customer-cookie.js')
  const controller = require('../controllers/customer/image-controller.js')

  router.get('/image/:filename', [authCookie.verifyCustomerCookie], controller.getImage)
  router.get('/:collection/:folder/:filename', [authCookie.verifyCustomerCookie], controller.getCollectionImage)

  app.use('/api/customer/images', router)
}
