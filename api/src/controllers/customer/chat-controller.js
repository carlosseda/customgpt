const mongooseDb = require('../../models/mongoose')
const Chat = mongooseDb.Chat
const Assistant = mongooseDb.Assistant

exports.findAll = (req, res) => {
  Chat.find({ customerStaffId: req.customerStaffId }, 'assistantEndpoint threadId resume')
    .sort({ createdAt: -1 })
    .then(result => {
      res.status(200).send(result)
    }).catch(err => {
      res.status(500).send({
        message: err.errors || 'Algún error ha surgido al recuperar los datos.'
      })
    })
}

exports.findOne = async (req, res) => {
  const threadId = req.params.threadId

  try{
  
    let chat = await Chat.findOne({ threadId: threadId, customerStaffId: req.customerStaffId })
    const assistant = await Assistant.findOne({ assistantEndpoint: chat.assistantEndpoint })

    chat.messages = chat.messages.reverse()
    chat.messages[0].content[0].text.value = chat.messages[0].content[0].text.value.replace(/\[.*?\]/g, '')

    const result = {
      assistant,
      chat
    }

    res.status(200).send(result)
  } catch (err) {
    res.status(500).send({
      message: 'Algún error ha surgido al recuperar los datos.'
    })
  }
}

exports.findLast = (req, res) => {
  Chat.findOne({ customerStaffId: req.customerStaffId }, 'assistantEndpoint threadId resume')
    .sort({ createdAt: -1 })
    .then(result => {
      res.status(200).send(result)
    }).catch(err => {
      res.status(500).send({
        message: err.errors || 'Algún error ha surgido al recuperar los datos.'
      })
    })
}
