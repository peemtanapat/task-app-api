const express = require('express')

require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// parsing json to Object
app.use(express.json())
// setting up routers
app.use(userRouter)
app.use(taskRouter)

app.get('/', (request, response) => {
  response.send('<h1>Welcome to TASK APP API.</h1>')
})

module.exports = app
