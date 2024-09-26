const verifyCustomerCookie = (req, res, next) => {
  if (req.session.customer) {
    next()
  } else {
    res.status(401).send({
      redirection: '/login'
    })
  }
}

const authCookie = {
  verifyCustomerCookie
}

module.exports = authCookie
