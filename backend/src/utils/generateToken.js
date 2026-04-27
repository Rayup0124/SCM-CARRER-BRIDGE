const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET env variable.');
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

module.exports = generateToken;

