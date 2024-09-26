module.exports = (app) => {
  const router = require('express').Router()
  const authCustomerJwt = require('../middlewares/auth-customer-jwt.js')
  const controller = require('../controllers/customer/image-controller.js')

  router.get('/image/:filename', [authCustomerJwt.verifyCustomerToken], controller.getImage)
  router.get('/:collection/:folderid/:filename', [authCustomerJwt.verifyCustomerToken], controller.getCollectionImage)

  app.use('/api/customer/images', router)
}
