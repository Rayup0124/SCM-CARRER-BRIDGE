const Favorite = require('../models/Favorite');
const Internship = require('../models/Internship');

const toggleFavorite = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can save internships' });
    }

    const { internshipId } = req.body;
    if (!internshipId) {
      return res.status(400).json({ message: 'internshipId is required' });
    }

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    const existing = await Favorite.findOne({ student: student._id, internship: internshipId });
    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.json({ saved: false, message: 'Removed from saved' });
    }

    await Favorite.create({ student: student._id, internship: internshipId });
    return res.status(201).json({ saved: true, message: 'Saved for later' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to toggle favorite', details: error.message });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view saved internships' });
    }

    const favorites = await Favorite.find({ student: student._id })
      .populate({
        path: 'internship',
        populate: { path: 'company', select: 'companyName' },
      })
      .sort({ createdAt: -1 });

    const internships = favorites
      .map((f) => f.internship)
      .filter(Boolean);

    return res.json(internships);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch favorites', details: error.message });
  }
};

const getMyFavoriteIds = async (req, res) => {
  try {
    const student = req.currentUser;
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view saved internships' });
    }

    const favorites = await Favorite.find({ student: student._id }).select('internship');
    return res.json(favorites.map((f) => f.internship.toString()));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch favorite ids', details: error.message });
  }
};

module.exports = { toggleFavorite, getMyFavorites, getMyFavoriteIds };
