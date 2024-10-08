const sequelizeDb = require('../../models/sequelize')
const mongooseDb = require('../../models/mongoose')
const Customer = sequelizeDb.Customer
const CustomerMongoDB = mongooseDb.Customer
const Op = sequelizeDb.Sequelize.Op

exports.create = (req, res) => {
  Customer.create(req.body).then(async data => {
    req.body.images = await req.imageService.resizeImages(req.body.images)
    req.body.customerId = data.id
    await CustomerMongoDB.create(req.body)
    res.status(200).send(data)
  }).catch(err => {
    res.status(500).send({
      message: err.errors || 'Algún error ha surgido al insertar el dato.'
    })
  })
}

exports.findAll = (req, res) => {
  const page = req.query.page || 1
  const limit = parseInt(req.query.size) || 10
  const offset = (page - 1) * limit
  const whereStatement = {}
  whereStatement.deletedAt = null

  for (const key in req.query) {
    if (req.query[key] !== '' && req.query[key] !== 'null' && key !== 'page' && key !== 'size') {
      whereStatement[key] = { [Op.substring]: req.query[key] }
    }
  }

  const condition = Object.keys(whereStatement).length > 0 ? { [Op.and]: [whereStatement] } : {}

  Customer.findAndCountAll({
    where: condition,
    attributes: ['id', 'commercialName', 'createdAt', 'updatedAt'],
    limit,
    offset,
    order: [['createdAt', 'DESC']]
  })
    .then(result => {
      result.meta = {
        total: result.count,
        pages: Math.ceil(result.count / limit),
        currentPage: page,
        size: limit
      }

      res.status(200).send(result)
    }).catch(err => {
      console.log(err)
      res.status(500).send({
        message: err.errors || 'Algún error ha surgido al recuperar los datos.'
      })
    })
}

exports.findOne = (req, res) => {
  const id = req.params.id

  Customer.findByPk(id).then(async data => {
    if (data) {
      const mongoData = await CustomerMongoDB.findOne({ customerId: id })

      data.dataValues.welcomeMessage = mongoData.welcomeMessage
      data.dataValues.images = mongoData.images ? mongoData.images.adminImages : []

      res.status(200).send(data)
    } else {
      res.status(404).send({
        message: `No se puede encontrar el elemento con la id=${id}.`
      })
    }
  }).catch(_ => {
    console.log(_)
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar la id=' + id
    })
  })
}

exports.update = (req, res) => {
  const id = req.params.id

  Customer.update(req.body, {
    where: { id }
  }).then(async ([numberRowsAffected]) => {
    if (numberRowsAffected === 1) {
      req.body.images = await req.imageService.resizeImages(req.body.images)
      await CustomerMongoDB.findOneAndUpdate({ customerId: id }, req.body)

      res.status(200).send({
        message: 'El elemento ha sido actualizado correctamente.'
      })
    } else {
      res.status(404).send({
        message: `No se puede actualizar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento o el cuerpo de la petición está vacío.`
      })
    }
  }).catch(_ => {
    res.status(500).send({
      message: 'Algún error ha surgido al actualiazar la id=' + id
    })
  })
}

exports.delete = (req, res) => {
  const id = req.params.id

  Customer.destroy({
    where: { id }
  }).then(async (numberRowsAffected) => {
    if (numberRowsAffected === 1) {
      await CustomerMongoDB.findOneAndUpdate({ customerId: id }, { deletedAt: new Date() })
      req.redisClient.publish('delete-customer', JSON.stringify({ id }))

      res.status(200).send({
        message: 'El elemento ha sido borrado correctamente'
      })
    } else {
      res.status(404).send({
        message: `No se puede borrar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento.`
      })
    }
  }).catch(_ => {
    console.log(_)
    res.status(500).send({
      message: 'Algún error ha surgido al borrar la id=' + id
    })
  })
}

exports.getCustomers = async (req, res) => {
  try {
    const result = await Customer.findAll({
      where: {
        deletedAt: null
      },
      attributes: ['commercialName', 'id']
    })

    const response = result.map(element => ({
      label: element.commercialName,
      value: element.id
    }))

    res.status(200).send(response)
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Algún error ha surgido al recuperar los datos.'
    })
  }
}
