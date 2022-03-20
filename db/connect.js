const { default: mongoose } = require("mongoose")

// Commands are buffered so no need to wait for this
const connect = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PW}@cluster0.cquvf.mongodb.net/fcc?retryWrites=true&w=majority`
    )
    return true
  } catch (e) {
    console.warn(e)
    return false
  }
}

module.exports = { connect }
