const sequelizeDb = require('../models/sequelize')
const mongooseDb = require('../models/mongoose')
const CustomerStaff = sequelizeDb.CustomerStaff
const CustomerStaffMongoDB = mongooseDb.CustomerStaff

exports.handleEvent = async (redisClient, subscriberClient) => {
  subscriberClient.subscribe('delete-customer', (err) => {
    if (err) {
      console.error('Error al suscribirse al canal:', err)
    }
  })

  subscriberClient.on('message', async (channel, message) => {
    if (channel === 'delete-customer') {
      try {
        const data = JSON.parse(message)
        const customerId = data.id

        const whereStatement = {
          deletedAt: { $exists: false },
          customerId
        }

        await CustomerStaffMongoDB.updateMany(
          whereStatement,
          { $set: { deletedAt: new Date() } }
        )

        await CustomerStaff.destroy(
          { where: { customerId } }
        )
      } catch (err) {
        console.error('Algún error ha surgido al borrar')
      }
    }
  })
}
