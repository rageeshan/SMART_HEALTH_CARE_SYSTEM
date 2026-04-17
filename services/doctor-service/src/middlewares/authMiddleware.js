const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET not configured' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      userId: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email,
    }

    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user?.role ?? 'unknown'} is not authorized to access this route`,
      })
    }
    return next()
  }
}

module.exports = { protect, authorize }
