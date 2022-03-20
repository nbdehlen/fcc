const { default: mongoose } = require("mongoose")

const Schema = mongoose.Schema

const Like = new Schema({
  stock: {
    type: String,
    required: true,
  },
  like: { type: String, required: true },
})

module.exports = mongoose.model("Like", Like)
