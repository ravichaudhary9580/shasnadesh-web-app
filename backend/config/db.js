const mongoose = require('mongoose')

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      console.log(`MongoDB Connected: ${conn.connection.host}`)
      return
    } catch (error) {
      console.error(`MongoDB Connection Attempt ${attempt}/${retries} Failed: ${error.message}`)
      if (attempt === retries) {
        console.error('❌ Could not connect to MongoDB after multiple retries. Exiting...')
        process.exit(1)
      }
      console.log(`Retrying in ${delay / 1000} seconds...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

module.exports = connectDB