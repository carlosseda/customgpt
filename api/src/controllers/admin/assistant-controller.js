const moment = require('moment')
const mongooseDb = require('../../models/mongoose')
const Assistant = mongooseDb.Assistant
const path = require('path')

exports.create = async (req, res) => {
  try {
    req.body.name = req.body.name.toLowerCase()
    req.body.chromadb = req.body.name.toLowerCase().replace(/ /g, '_')
    req.body.images = await req.imageService.resizeImages(req.body.images)

    let data = await Assistant.create(req.body)
    data = data.toObject()
    data.id = data._id.toString()

    res.status(200).send(data)
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: err.errors || 'Algún error ha surgido al insertar el dato.'
    })
  }
}

exports.findAll = async (req, res) => {
  const page = req.query.page || 1
  const limit = parseInt(req.query.size) || 10
  const offset = (page - 1) * limit
  const whereStatement = {}
  whereStatement.deletedAt = { $exists: false }

  for (const key in req.query) {
    if (req.query[key] !== '' && req.query[key] !== 'null' && key !== 'page' && key !== 'size') {
      whereStatement[key] = { $regex: req.query[key], $options: 'i' }
    }
  }

  try {
    const result = await Assistant.find(whereStatement)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec()

    const count = await Assistant.countDocuments(whereStatement)

    const response = {
      rows: result.map(doc => ({
        ...doc,
        id: doc._id,
        _id: undefined,
        createdAt: moment(doc.createdAt).format('YYYY-MM-DD HH:mm'),
        updatedAt: moment(doc.updatedAt).format('YYYY-MM-DD HH:mm')
      })),
      meta: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        size: limit
      }
    }

    res.status(200).send(response)
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Algún error ha surgido al recuperar los datos.'
    })
  }
}

exports.findOne = async (req, res) => {
  const id = req.params.id

  try {
    const data = await Assistant.findById(id).lean().exec()
    data.images = data.images ? data.images.adminImages : []

    if (data) {
      data.id = data._id
      delete data._id
    }

    if (data) {
      res.status(200).send(data)
    } else {
      res.status(404).send({
        message: `No se puede encontrar el elemento con la id=${id}.`
      })
    }
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar la id=' + id
    })
  }
}

exports.update = async (req, res) => {
  const id = req.params.id

  try {
    req.body.name = req.body.name.toLowerCase()
    req.body.chromadb = req.body.name.toLowerCase().replace(/ /g, '_')
    req.body.images = await req.imageService.resizeImages(req.body.images)

    let data = await Assistant.findByIdAndUpdate(id, req.body, { new: true })

    if (data) {
      data = data.toObject()
      data.id = data._id.toString()
      res.status(200).send(data)
    } else {
      res.status(404).send({
        message: `No se puede actualizar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento o el cuerpo de la petición está vacío.`
      })
    }
  } catch (err) {
    console.log(err)
    res.status(500).send({
      message: 'Algún error ha surgido al actualizar la id=' + id
    })
  }
}

exports.delete = async (req, res) => {
  const id = req.params.id

  try {
    const data = await Assistant.findByIdAndUpdate(id, { deletedAt: new Date() })

    if (data) {
      req.redisClient.publish('delete-assistant', JSON.stringify(data))

      res.status(200).send({
        message: 'El elemento ha sido borrado correctamente.'
      })
    } else {
      res.status(404).send({
        message: `No se puede borrar el elemento con la id=${id}. Tal vez no se ha encontrado el elemento.`
      })
    }
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al borrar la id=' + id
    })
  }
}

exports.scrapping = async (req, res) => {
  const id = req.params.id

  try {
    const data = await Assistant.findById(id).lean().exec()
    const categories = data.categories.map(category => `"${category.name}"`).join(', ')

    const filePath = path.resolve(__dirname, `../../selenium/${data.name.toLowerCase()}.js`)
    const ScrappingClass = require(filePath)
    const scrappingClass = new ScrappingClass()
    await scrappingClass.setChromaClient(data.name)
    await scrappingClass.setCategories(categories)
    await scrappingClass.scrapping()

    res.status(200).send({
      message: 'El proceso de scrapping ha finalizado correctamente.'
    })
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar la id=' + id
    })
  }
}
