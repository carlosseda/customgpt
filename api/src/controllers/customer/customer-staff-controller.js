const mongooseDb = require('../../models/mongoose')
const CustomerStaff = mongooseDb.CustomerStaff

exports.findOne = async (req, res) => {
  try {
    const data = await CustomerStaff.findOne({ customerStaffId: req.session.customer.customerStaffId })
    res.status(200).send(data)
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar los datos.'
    })
  }
}
