const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // For now, in a microservices environment, Member 1 Auth Service issues this.
      // We are decoding it. If Member 1 hasn't finished, we can just mock the user.
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'member1_secret_placeholder');
      req.user = decoded; // Should contain userId and role (Patient, Doctor, Admin)
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

// Mock authentication for easy development testing internally
const mockProtect = (req, res, next) => {
  req.user = req.headers['x-mock-user'] 
    ? JSON.parse(req.headers['x-mock-user']) 
    : { userId: 'mock-user-123', role: 'Doctor' };
  next();
};

module.exports = { protect, authorize, mockProtect };
