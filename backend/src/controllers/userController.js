const User = require('../models/User');
const { ALLOWED_PROGRAMMES } = require('../constants/programmes');
const { normalizeSkillsArray } = require('../utils/skillNormalize');

const getProgrammes = (_req, res) => {
  return res.json({ programmes: ALLOWED_PROGRAMMES });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.authContext.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.resumeUrls?.length && user.resumeUrl) {
      user.resumeUrls = [user.resumeUrl];
    } else if (!user.resumeUrls) {
      user.resumeUrls = [];
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch profile', details: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const existing = await User.findById(req.authContext.id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowedFields = ['name', 'programme', 'skills', 'resumeUrl'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.programme !== undefined) {
      const next = updates.programme;
      const inCatalogue = ALLOWED_PROGRAMMES.includes(next);
      const unchangedLegacy = next === existing.programme;
      if (!inCatalogue && !unchangedLegacy) {
        return res.status(400).json({ message: 'Invalid programme selected' });
      }
    }

    if (updates.skills !== undefined) {
      updates.skills = normalizeSkillsArray(updates.skills);
    }

    const user = await User.findByIdAndUpdate(
      req.authContext.id,
      updates,
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update profile', details: error.message });
  }
};

module.exports = { getProgrammes, getMe, updateMe };
