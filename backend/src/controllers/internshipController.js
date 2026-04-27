const Internship = require('../models/Internship');
const Application = require('../models/Application');
const SkillStats = require('../models/SkillStats');
const { normalizeTargetedProgrammes } = require('../constants/programmes');
const { FIXED_SKILL_SUGGESTIONS } = require('../constants/skillSuggestions');
const { normalizeSkillLabel, normalizeSkillsArray } = require('../utils/skillNormalize');

function withNormalizedTargetPrograms(doc) {
  if (!doc) return doc;
  const plain = doc.toObject ? doc.toObject() : { ...doc };
  plain.targetedProgrammes = normalizeTargetedProgrammes(plain.targetedProgrammes);
  plain.skills = normalizeSkillsArray(plain.skills || []);
  return plain;
}

/**
 * Normalize skill array, then upsert each entry into SkillStats (count + 1).
 * Only counts "freely written / Other" skills; the 15 fixed selectable skills are excluded
 * (compared against the normalized fixed-skill list).
 */
async function upsertSkillStats(skills, fixedSkills = []) {
  const fixedCanonical = new Set(
    fixedSkills.map((f) => normalizeSkillLabel(f).toLowerCase()),
  );
  const updates = skills.map((s) => {
    const label = normalizeSkillLabel(s);
    if (!label) return null;
    if (fixedCanonical.has(label.toLowerCase())) return null;
    return SkillStats.updateOne(
      { skill: label },
      { $inc: { count: 1 }, $setOnInsert: { source: 'dynamic' } },
      { upsert: true },
    );
  });
  await Promise.all(updates.filter(Boolean));
}

const getCompanyInternships = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Company context not found' });
    }

    const internships = await Internship.find({ company: company._id }).sort({ createdAt: -1 });
    const internshipIds = internships.map((i) => i._id);

    if (internshipIds.length === 0) {
      return res.json(
        internships.map((i) => {
          const o = i.toObject();
          return {
            ...o,
            targetedProgrammes: normalizeTargetedProgrammes(o.targetedProgrammes),
            skills: normalizeSkillsArray(o.skills || []),
            applicantCount: 0,
            applicantCountByStatus: {},
          };
        }),
      );
    }

    const counts = await Application.aggregate([
      { $match: { internship: { $in: internshipIds } } },
      { $group: { _id: { internship: '$internship', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const countByInternship = {};
    internships.forEach((i) => {
      countByInternship[i._id.toString()] = { total: 0, byStatus: {} };
    });
    counts.forEach((c) => {
      const id = c._id.internship.toString();
      if (!countByInternship[id]) return;
      countByInternship[id].total += c.count;
      countByInternship[id].byStatus[c._id.status] = c.count;
    });

    const result = internships.map((i) => {
      const d = i.toObject();
      const stats = countByInternship[i._id.toString()] || { total: 0, byStatus: {} };
      return {
        ...d,
        targetedProgrammes: normalizeTargetedProgrammes(d.targetedProgrammes),
        skills: normalizeSkillsArray(d.skills || []),
        applicantCount: stats.total,
        applicantCountByStatus: stats.byStatus,
      };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch company internships', details: error.message });
  }
};

const getInternships = async (_req, res) => {
  try {
    const internships = await Internship.find({ isPublished: true, status: 'Open', isDraft: { $in: [false, undefined] } })
      .populate('company', 'companyName verificationStatus')
      .sort({ createdAt: -1 });

    const visible = internships.filter((i) => i.company?.verificationStatus === 'approved');
    return res.json(visible.map((i) => withNormalizedTargetPrograms(i)));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch internships', details: error.message });
  }
};

const getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findById(id).populate('company', 'companyName verificationStatus website');
    if (!internship || !internship.isPublished || internship.status !== 'Open' || (internship.isDraft === true)) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    if (internship.company?.verificationStatus !== 'approved') {
      return res.status(404).json({ message: 'Internship not found' });
    }

    return res.json(withNormalizedTargetPrograms(internship));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch internship', details: error.message });
  }
};

const getCompanyInternshipById = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Company context not found' });
    }

    const { id } = req.params;
    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (String(internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only view your own internships' });
    }

    return res.json(withNormalizedTargetPrograms(internship));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch internship', details: error.message });
  }
};

const createInternship = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Company context not found' });
    }

    if (company.verificationStatus !== 'approved') {
      return res.status(403).json({ message: 'Company must be approved before posting roles' });
    }

    const { title, description, skills = [], targetedProgrammes = [], location, duration, supervisorName, meetingCadence, deliverableCheckpoints, requiredAttachments = [] } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const internship = await Internship.create({
      title,
      description,
      skills: normalizeSkillsArray(skills),
      targetedProgrammes: normalizeTargetedProgrammes(targetedProgrammes),
      location,
      duration,
      supervisorName,
      meetingCadence,
      deliverableCheckpoints,
      company: company._id,
      isDraft: req.body.isDraft === true,
      isPublished: req.body.isDraft !== true,
      requiredAttachments,
    });

    // Track non-fixed skill usage count
    await upsertSkillStats(skills, FIXED_SKILL_SUGGESTIONS).catch(() => {});

    return res.status(201).json(withNormalizedTargetPrograms(internship));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create internship', details: error.message });
  }
};

const updateInternship = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Company context not found' });
    }

    const { id } = req.params;
    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (String(internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only update your own internships' });
    }

    const { title, description, skills, targetedProgrammes, location, duration, supervisorName, meetingCadence, deliverableCheckpoints, status, isPublished, isDraft, requiredAttachments } = req.body;

    if (title !== undefined) internship.title = title;
    if (description !== undefined) internship.description = description;
    if (skills !== undefined) internship.skills = normalizeSkillsArray(skills);
    if (targetedProgrammes !== undefined) {
      internship.targetedProgrammes = normalizeTargetedProgrammes(targetedProgrammes);
    }
    if (location !== undefined) internship.location = location;
    if (duration !== undefined) internship.duration = duration;
    if (supervisorName !== undefined) internship.supervisorName = supervisorName;
    if (meetingCadence !== undefined) internship.meetingCadence = meetingCadence;
    if (deliverableCheckpoints !== undefined) internship.deliverableCheckpoints = deliverableCheckpoints;
    if (status !== undefined) internship.status = status;
    if (isPublished !== undefined) internship.isPublished = isPublished;
    if (isDraft !== undefined) internship.isDraft = isDraft;
    if (requiredAttachments !== undefined) internship.requiredAttachments = requiredAttachments;

    await internship.save();

    // Track non-fixed skill usage count
    if (skills !== undefined) {
      await upsertSkillStats(skills, FIXED_SKILL_SUGGESTIONS).catch(() => {});
    }

    return res.json(withNormalizedTargetPrograms(internship));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update internship', details: error.message });
  }
};

const deleteInternship = async (req, res) => {
  try {
    const company = req.currentCompany;
    if (!company) {
      return res.status(403).json({ message: 'Company context not found' });
    }

    const { id } = req.params;
    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    if (String(internship.company) !== String(company._id)) {
      return res.status(403).json({ message: 'You can only delete your own internships' });
    }

    await Application.deleteMany({ internship: internship._id });
    await Internship.findByIdAndDelete(id);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete internship', details: error.message });
  }
};

const getSkillsStats = async (_req, res) => {
  try {
    const pipeline = [
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const results = await Internship.aggregate(pipeline);

    const merged = {};
    for (const item of results) {
      const label = normalizeSkillLabel(item._id);
      if (!label) continue;
      const key = label.toLowerCase();
      if (!merged[key]) merged[key] = { skill: label, count: 0 };
      merged[key].count += item.count;
    }

    return res.json(
      Object.values(merged).sort((a, b) => b.count - a.count),
    );
  } catch (error) {
    return res.status(500).json({ message: 'Unable to calculate skills stats', details: error.message });
  }
};

/**
 * Returns skills with count >= minCount, for the frontend to merge into suggestions.
 * GET /api/internships/skills/popular?minCount=3
 */
const getPopularSkills = async (req, res) => {
  try {
    const minCount = parseInt(req.query.minCount, 10) || 3;

    const skills = await SkillStats.find({
      count: { $gte: minCount },
      source: 'dynamic',
    })
      .sort({ count: -1 })
      .select('skill count')
      .lean();

    return res.json(skills.map((s) => s.skill));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch popular skills', details: error.message });
  }
};

module.exports = {
  getInternships,
  getInternshipById,
  getCompanyInternshipById,
  createInternship,
  updateInternship,
  deleteInternship,
  getSkillsStats,
  getPopularSkills,
  getCompanyInternships,
};

