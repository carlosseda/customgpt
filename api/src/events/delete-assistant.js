const mongooseDb = require('../models/mongoose')
const CustomerStaff = mongooseDb.CustomerStaff

exports.handleEvent = async (redisClient, subscriberClient) => {
  subscriberClient.subscribe('delete-assistant', (err) => {
    if (err) {
      console.error('Error al suscribirse al canal:', err)
    }
  })

  subscriberClient.on('message', async (channel, message) => {
    if (channel === 'delete-assistant') {
      try {
        const data = JSON.parse(message)
        const assistantId = data._id

        const whereStatement = {
          deletedAt: { $exists: false },
          assistants: assistantId
        }

        const result = await CustomerStaff.find(whereStatement).lean().exec()

        if (result.length === 0) {
          return
        }

        await CustomerStaff.updateMany(
          whereStatement,
          { $pull: { assistants: assistantId } }
        )
      } catch (err) {
        console.log(err)
        console.error('Algún error ha surgido al borrar')
      }
    }
  })
}
