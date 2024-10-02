module.exports = (mongoose) => {
  const schema = mongoose.Schema(
    {
      customerStaffId: {
        type: String
      },
      customerId: {
        type: String
      },
      staffCategoryId: {
        type: String
      },
      name: {
        type: String
      },
      surname: {
        type: String
      },
      email: {
        type: String
      },
      language: {
        type: String
      },
      images: {
        type: mongoose.Schema.Types.Mixed
      },
      deletedAt: Date
    },
    { timestamps: true }
  )

  const CustomerStaff = mongoose.model('CustomerStaff', schema, 'customer-staffs')
  return CustomerStaff
}
