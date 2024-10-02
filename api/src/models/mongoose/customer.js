module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      customerId: {
        type: String
      },
      name: {
        type: String
      },
      welcomeMessage: {
        type: String
      },
      images: {
        type: mongoose.Schema.Types.Mixed
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Customer = mongoose.model('Customer', schema, 'customers')
  return Customer
}
