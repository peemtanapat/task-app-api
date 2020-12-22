const mongoose = require('mongoose')
const connectionURL = process.env.MONGODB_URL
const databaseName = process.env.DB_NAME
mongoose.connect(`${connectionURL}/${databaseName}`, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
