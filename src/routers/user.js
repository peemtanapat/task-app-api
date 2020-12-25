const multer = require('multer')
const sharp = require('sharp')
const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelSurveyEmail } = require('../email/account')

const User = require('../models/user')
const { response } = require('express')
const { send } = require('@sendgrid/mail')

router.post('/users/login', async (request, response) => {
  const { email, password } = request.body
  try {
    const user = await User.findByCredentials(email, password)
    const token = await user.generateAuthToken()

    response.send({ user, token })
  } catch (error) {
    response.status(400).send()
  }
})

router.post('/users/logout', auth, async (request, response) => {
  try {
    request.user.tokens = request.user.tokens.filter((token) => {
      return token.token !== request.token
    })
    await request.user.save()

    response.send()
  } catch (error) {
    response.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (request, response) => {
  try {
    request.user.tokens = []
    await request.user.save()

    response.send()
  } catch (error) {
    response.status(500).send()
  }
})

router.get('/users/me', auth, async (request, response) => {
  response.send(request.user)
})

router.get('/users', auth, async (request, response) => {
  try {
    const users = await User.find({})

    response.send(users)
  } catch (error) {
    // send server error message
    response.status(500).send({ message: error.message })
  }
})

router.get('/users/:id', async (request, response) => {
  const { id } = request.params

  try {
    const user = await User.findById(id)

    if (!user) {
      return response.status(404).send({ message: 'Not Found' })
    }

    response.send(user)
  } catch (error) {
    // send server error message
    response.status(500).send({ message: error.message })
  }
})

router.post('/users', async (request, response) => {
  const user = new User(request.body)

  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()

    response.status(201).send({ user, token })
  } catch (error) {
    // send client error message
    console.log(error.message);
    response.status(400).send({ message: error.message })
  }
})

router.patch('/users/me', auth, async (request, response) => {
  const updateFields = Object.keys(request.body)
  const allowedFields = ['name', 'email', 'password', 'age']
  const isValidFields = updateFields.every((field) => allowedFields.includes(field))

  if (!isValidFields) {
    return response.status(400).send({ message: 'Unknown update field' })
  }

  //   const { id } = request.params

  try {
    // option 'new' if true, return the modified document rather than the original. defaults to false
    // const user = await User.findByIdAndUpdate(id, request.body, { new: true, runValidators: true })
    // const user = await User.findById(id)
    const user = request.user

    updateFields.forEach((field) => {
      user[field] = request.body[field]
    })

    await user.save()
    response.send(user)
  } catch (error) {
    response.status(400).send({ message: error.message })
  }
})

router.delete('/users/me', auth, async (request, response) => {
  const user = request.user
  try {
    await user.remove()
    sendCancelSurveyEmail(user.email, user.name)

    response.send(user)
  } catch (error) {
    response.status(500).send({ message: error.message })
  }
})

// multer configurations
const upload = multer({
  // dest: 'avatars',
  limits: {
    fileSize: 1000000,
  },
  fileFilter(request, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
      return callback(new Error('Avatar file must be jpg/jpeg/png only'))
    }

    callback(null, true)
  },
})
// use multer in middleware to manage a uploaded file
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (request, response) => {
    const user = request.user
    const buffer = await sharp(request.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    // to get file buffer from request. we need to remove 'dest' config in multer
    user.avatar = buffer
    await user.save()
    response.send()
  },
  (error, request, response, next) => {
    response.status(400).send({ error: error.message })
  }
)

router.get('/users/:id/avatar', async (request, response) => {
  try {
    const user = await User.findById(request.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    response.set('Content-Type', 'image/png')
    response.send(user.avatar)
  } catch (error) {
    response.status(404).send()
  }
})

router.delete('/users/me/avatar', auth, async (request, response) => {
  try {
    const user = request.user
    if (!user.avatar) {
      return response.send()
    }

    // user.avatar = undefined // undefined will remove the field avatar
    user.avatar = null
    await user.save()

    response.send()
  } catch (error) {
    response.status(500).send({ error: error.message })
  }
})

module.exports = router
