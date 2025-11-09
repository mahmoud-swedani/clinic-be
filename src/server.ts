import app from './app'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`)
    })
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err))
