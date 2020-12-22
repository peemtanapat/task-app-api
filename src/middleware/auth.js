const jwt = require('jsonwebtoken')
const User = require('../models/user')

const auth = async (request, response, next) => {
  try {
    const token = request.header('Authorization').replace('Bearer ', '')

    if (!token || token.length < 20) {
      throw new Error()
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

    if (!user) {
      return response.status(404).send({ message: 'Email or Password is wrong. Please try again.' })
    }

    request.token = token
    request.user = user
    next()
  } catch (error) {
    response.status(401).send({ message: 'Authorization header is not found' })
  }
}

module.exports = auth
