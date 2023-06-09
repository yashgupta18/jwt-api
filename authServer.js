require('dotenv').config()
const cors = require('cors')
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')

app.use(express.json())
app.use(cors());

let refreshTokens = []
const users = [
  {
    username: 'Kyle',
    password: '12345'
  },
  {
    username: 'Jim',
    password: '12345'
  }
]

const posts = [
  {
    username: 'Kyle',
    title: 'Todos1'
  },
  {
    username: 'Jim',
    title: 'Todos2'
  }
]

app.get('/todos', authenticateToken, (req, res) => {
  console.log(req.user.name);
  const result = posts.filter(post => post.username.toLowerCase() === req.user.name)
  console.log({ result });
  res.json(result)
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401)
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
  })
})

app.delete('/logout', (req, res) => {
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})

app.post('/login', (req, res) => {
  // Authenticate User


  console.log(req.body);
  const username = req.body.username

  const password = req.body.password

  const userExists = users.find(user => user.username.toLowerCase() === username.toLowerCase())
  console.log({ userExists });

  if (!userExists) return res.status(401).json({ message: "User doesn't exist" })
  if (userExists.password !== password) return res.status(403).json({ message: "Invalid credentials" })

  const user = { name: username }

  const accessToken = generateAccessToken(user)
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
  refreshTokens.push(refreshToken)
  res.json({ accessToken: accessToken, refreshToken: refreshToken, user: user })
})

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' })
}

app.listen(4000)