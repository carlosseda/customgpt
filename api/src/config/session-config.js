const session = require('express-session')
const RedisStore = require('connect-redis').default
const IORedis = require('ioredis')

const redisClient = new IORedis(process.env.REDIS_URL)

const sessionConfig = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    domain: new URL(process.env.API_URL).hostname,
    path: '/',
    sameSite: 'Lax',
    maxAge: 1000 * 60 * 3600
  }
})

module.exports = { sessionConfig, redisClient }
