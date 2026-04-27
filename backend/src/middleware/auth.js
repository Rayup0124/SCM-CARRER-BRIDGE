const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      let role;

      if (decoded.role === 'admin') {
        role = 'admin';
      } else if (decoded.accountType === 'user') {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        req.currentUser = user;
        role = user.role;
      } else if (decoded.accountType === 'company') {
        const company = await Company.findById(decoded.id).select('-password');
        if (!company) {
          return res.status(401).json({ message: 'Company not found' });
        }
        req.currentCompany = company;
        role = 'company';
      } else {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      if (allowedRoles.length && !allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.authContext = { id: decoded.id, role, accountType: decoded.accountType };
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', details: error.message });
    }
  };
};

module.exports = authorize;

