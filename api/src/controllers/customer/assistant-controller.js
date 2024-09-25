const mongooseDb = require('../../models/mongoose')
const Assistant = mongooseDb.Assistant
const OpenAIService = require('../../services/openai-service')
const { ChromaClient } = require('chromadb')
const chromaClient = new ChromaClient()
const { broadcast } = require('../../services/websocket-service')

exports.findAll = async (req, res) => {
  const whereStatement = {}
  whereStatement.deletedAt = { $exists: false }

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
    await openai.createMessage(prompt)
    await openai.createAnswer(req.body.assistant.assistantEndpoint)

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
