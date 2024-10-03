module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      name: {
        type: String
      },
      shortDescription: {
        type: String
      },
      description: {
        type: String
      },
      chromadb: {
        type: String
      },
      assistantEndpoint: {
        type: String
      },
      images: {
        type: mongoose.Schema.Types.Mixed
      },
      examples: [{
        id: { type: String },
        title: { type: String },
        prompt: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        deletedAt: { type: Date }
      }],
      categories: [{
        id: { type: String },
        name: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        deletedAt: { type: Date }
      }],
      customers: [{
        id: { type: String },
        customerId: { type: String },
        name: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        deletedAt: { type: Date }
      }],
      deletedAt: Date
    },
    { timestamps: true }
  )

  const Assistant = mongoose.model('Assistant', schema, 'assistants')
  return Assistant
}
