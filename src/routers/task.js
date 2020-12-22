const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')

const Task = require('../models/task')

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (request, response) => {
  const match = {}
  const sort = {}

  if (request.query.completed) {
    match.completed = request.query.completed === 'true'
  }

  if (request.query.sortBy) {
    const parts = request.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  const user = request.user
  try {
    // const tasks = await Task.find({})
    // await user.populate('tasks').execPopulate()
    await user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(request.query.limit),
          skip: parseInt(request.query.skip),
          sort,
        },
      })
      .execPopulate()
    response.status(200).send(user.tasks)
  } catch (error) {
    // send server error message
    response.status(500).send({ message: error.message })
  }
})

router.get('/tasks/:id', auth, async (request, response) => {
  const { id } = request.params
  const user = request.user

  try {
    const task = await Task.findOne({ _id: id, owner: user._id })

    if (!task) {
      return response.status(404).send()
    }

    response.status(200).send(task)
  } catch (error) {
    // send server error message
    response.status(500).send({ message: error.message })
  }
})

router.post('/tasks', auth, async (request, response) => {
  const task = new Task({ ...request.body, owner: request.user._id })

  try {
    await task.save()
    response.status(201).send(task)
  } catch (error) {
    // send server error message
    response.status(400).send({ message: error.message })
  }
})

router.patch('/tasks/:id', auth, async (request, response) => {
  const updateFields = Object.keys(request.body)
  const allowedFields = ['description', 'completed']
  const isValidFields = updateFields.every((field) => allowedFields.includes(field))

  if (!isValidFields) {
    return response.status(400).send({ message: 'Unknown update field' })
  }

  const { id } = request.params
  const user = request.user

  try {
    // // option 'new' if true, return the modified document rather than the original. defaults to false
    // const task = await Task.findByIdAndUpdate(id, request.body, { new: true, runValidators: true })
    const task = await Task.findOne({ _id: id, owner: user._id })

    if (!task) {
      return response.status(404).send()
    }

    updateFields.forEach((field) => {
      task[field] = request.body[field]
    })

    await task.save()

    response.send(task)
  } catch (error) {
    response.status(400).send({ message: error.message })
  }
})

router.delete('/tasks/:id', auth, async (request, response) => {
  const { id } = request.params
  const user = request.user

  try {
    const task = await Task.findOneAndDelete({ _id: id, owner: user._id })

    if (!task) {
      response.status(404).send()
    }
    response.send(task)
  } catch (error) {
    response.status(500).send({ message: error.message })
  }
})

module.exports = router
