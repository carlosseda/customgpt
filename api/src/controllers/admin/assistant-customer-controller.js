const uuid = require('uuid')
const mongooseDb = require('../../models/mongoose')
const sequelizeDb = require('../../models/sequelize')
const Assistant = mongooseDb.Assistant
const Customer = sequelizeDb.Customer

exports.create = async (req, res) => {
  try {
    const data = await Customer.findByPk(req.body.customerId)

    const customer = Object.keys(req.body)
    req.body.id = uuid.v4()
    req.body.name = data.commercialName

    await Assistant.findByIdAndUpdate(req.body.parentId, {
      $push: {
        customers: req.body
      }
    })

    res.status(200).send(customer)
  } catch (err) {
    res.status(500).send({
      message: err.errors || 'Algún error ha surgido al insertar el dato.'
    })
  }
}

exports.findAll = async (req, res) => {
  const whereStatement = {}
  whereStatement.deletedAt = { $exists: false }
  whereStatement._id = req.query.parent

  try {
    const result = await Assistant.findOne(whereStatement)
      .sort({ createdAt: -1 })
      .lean()
      .exec()

    const response = {
      rows: (result.customers)
        ? result.customers.filter(customer => !customer.deletedAt).map(row => ({
          ...row
        }))
        : []
    }

    res.status(200).send(response)
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: err.message || 'Algún error ha surgido al recuperar los datos.'
    })
  }
}

exports.findOne = async (req, res) => {
  const id = req.params.id

  try {
    const whereStatement = {}
    whereStatement.deletedAt = { $exists: false }
    whereStatement._id = req.query.parent

    const result = await Assistant.findOne(whereStatement)
      .lean()
      .exec()

    let data = result.customers.find(customer => customer.id === id)

    if (data) {
      const newData = {}

      for (const key in data) {
        if (key === 'id') continue
        newData[key] = data[key]
      }

      data = newData
      data.id = id

      res.status(200).send(data)
    } else {
      res.status(404).send({
        message: `No se puede encontrar el elemento con la id=${id}.`
      })
    }
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar la id=' + id
    })
  }
}

exports.update = async (req, res) => {
  const id = req.params.id

  try {
    const whereStatement = {}
    whereStatement.deletedAt = { $exists: false }
    whereStatement._id = req.body.parentId

    const result = await Assistant.findOne(whereStatement)
      .lean()
      .exec()

    const data = result.customers.find(customer => customer.id === id)

    if (data) {
      const update = {}

      for (const key in req.body) {
        if (key === 'id') continue
        update[`customers.$.${key}`] = req.body[key]
      }

      await Assistant.updateOne(
        { _id: req.body.parentId, 'customers.id': id },
        { $set: update }
      )

      res.status(200).send({
        message: 'El elemento ha sido actualizado correctamente.'
      })
    } else {
      res.status(404).send({
        message: `No se puede actualizar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento o el cuerpo de la petición está vacío.`
      })
    }
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al actualizar la id=' + id
    })
  }
}

exports.delete = async (req, res) => {
  const id = req.params.id

  try {
    const whereStatement = {}
    whereStatement.deletedAt = { $exists: false }
    whereStatement._id = req.query.parent

    const result = await Assistant.findOne(whereStatement)
      .lean()
      .exec()

    const data = result.customers.find(customer => customer.id === id)

    if (data) {
      await Assistant.updateOne(
        { _id: req.query.parent, 'customers.id': id },
        { $set: { 'customers.$.deletedAt': new Date() } }
      )

      res.status(200).send({
        message: 'El elemento ha sido borrado correctamente.'
      })
    } else {
      res.status(404).send({
        message: `No se puede borrar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento o el cuerpo de la petición está vacío.`
      })
    }
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al borrar la id=' + id
    })
  }
}

exports.getAssistants = async (req, res) => {
  const customerId = req.query.id

  try {
    const whereStatement = {
      deletedAt: { $exists: false },
      customers: {
        $elemMatch: {
          customerId
        }
      }
    }

    const result = await Assistant.find(whereStatement)
      .lean()
      .exec()

    const response = result.map(element => ({
      label: element.name,
      value: element._id
    }))

    res.status(200).send(response)
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar los datos.'
    })
  }
}
