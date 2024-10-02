const mongooseDb = require('../../models/mongoose')
const Customer = mongooseDb.Customer

exports.findOne = async  (req, res) => {
  try {
    const data = await Customer.findOne({ customerId: req.session.customer.customerId })
    res.status(200).send(data)
  }catch(err){
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar los datos.'
    })
  }
}
