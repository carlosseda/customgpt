module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      name: {
        type: String
      },
      chromadb: {
        type: String
      },
      assistantEndpoint: {
        type: String
      },
      examples: [{
        type: mongoose.Schema.Types.Mixed
      }],
      categories: [{
        type: mongoose.Schema.Types.Mixed
      }],
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Assistant = mongoose.model('Assistant', schema, 'assistants')
  return Assistant
}
