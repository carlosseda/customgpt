const mongooseDb = require('../../models/mongoose')
const Assistant = mongooseDb.Assistant
const OpenAIService = require('../../services/openai-service')
const { ChromaClient } = require('chromadb')
const chromaClient = new ChromaClient()
const fs = require('fs')
const path = require('path')
const { broadcast } = require('../../services/websocket-service')

exports.findAll = async (req, res) => {
  const { assistants } = req.body

  const whereStatement = {
    deletedAt: { $exists: false },
    _id: { $in: assistants }
  }

  try {
    const result = await Assistant.find(whereStatement)
      .sort({ createdAt: -1 })
      .lean()
      .exec()

    res.status(200).send(result)
  } catch (err) {
    res.status(500).send({
      message: err.message || 'Algún error ha surgido al recuperar los datos.'
    })
  }
}

exports.assistantResponse = async (req, res) => {
  try {
    const openai = new OpenAIService()
    let prompt = ''

    if (req.body.threadId) {
      await openai.setThread(req.body.threadId)
      prompt = req.body.prompt
    } else {
      broadcast('responseState', 'consultando mi fuente de conocimiento...')

      const chromadbCollection = await chromaClient.getOrCreateCollection({ name: req.body.assistant.name })
      const categories = req.body.assistant.categories.map(category => category.name)
      const object = await openai.extractKeywordsAndCategory(req.body.prompt, categories)

      const result = await chromadbCollection.query({
        nResults: 10,
        queryTexts: [object.keywords.join(' ')],
        where: {
          category: object.category
        }
      })

      const elements = result.documents[0].map((_, i) => {
        const element = {}

        Object.entries(result.metadatas[0][i]).forEach(([key, value]) => {
          element[key] = value
        })

        return element
      })

      prompt = `${req.body.prompt} ${JSON.stringify(elements)}`
      await openai.createThread()
    }

    broadcast('responseState', 'analizando los datos...')
    await openai.setAssistant(req.body.assistant.assistantEndpoint)
    await openai.createMessage(prompt)
    await openai.runStatus()

    if (openai.tools) {
      const toolsOutputs = []

      for (const tool of openai.tools) {
        const data = JSON.parse(tool.function.arguments)

        if (tool.function.name === 'get_images') {
          broadcast('responseState', 'seleccionando imágenes...')
          const images = await this.getImages(req.body.assistant.name, data.productId)
          toolsOutputs.push({
            tool_call_id: tool.id,
            output: images
          })
        }

        if (tool.function.name === 'analyze_images') {
          broadcast('responseState', 'seleccionando imágenes...')
          const { imagesBuffer, imagesUrl } = await this.analyzeImages(req.body.assistant.name, data.productId)
          broadcast('responseState', 'analizando imágenes...')
          const answer = await openai.analyzeImages(imagesBuffer, prompt)

          const output = {
            imagesUrl,
            answer
          }

          toolsOutputs.push({
            tool_call_id: tool.id,
            output: JSON.stringify(output)
          })
        }
      }

      await openai.submitToolOutputs(toolsOutputs)
    }

    const data = {
      customerStaffId: req.customerStaffId,
      threadId: openai.threadId,
      assistantName: req.body.assistant.name,
      assistantEndpoint: req.body.assistant.assistantEndpoint,
      run: openai.run,
      messages: openai.messages
    }

    req.redisClient.publish('new-chat-message', JSON.stringify(data))

    const response = {
      threadId: openai.threadId,
      answer: openai.answer
    }

    res.status(200).send(response)
  } catch (error) {
    console.log(error)
  }
}

exports.getImages = async (collection, folderId) => {
  const images = []
  const imagesPath = path.join(__dirname, `../../storage/assistants/${collection}/images/${folderId}`)

  if (fs.existsSync(imagesPath)) {
    const files = fs.readdirSync(imagesPath)

    for (const file of files) {
      const url = `${process.env.API_URL}/api/customer/images/${collection}/${folderId}/${file}`
      images.push({ url })
    }
  }

  return JSON.stringify(images)
}

exports.analyzeImages = async (collection, folderId) => {
  const imagesBuffer = []
  const imagesUrl = []
  const imagesPath = path.join(__dirname, `../../storage/assistants/${collection}/images/${folderId}`)

  if (fs.existsSync(imagesPath)) {
    const files = fs.readdirSync(imagesPath)

    for (const file of files) {
      const url = `${process.env.API_URL}/api/customer/images/${collection}/${folderId}/${file}`
      imagesUrl.push({ url })

      const image = fs.readFileSync(path.join(imagesPath, file))
      imagesBuffer.push(image.toString('base64'))
    }
  }

  const images = {
    imagesBuffer,
    imagesUrl
  }

  return images
}
