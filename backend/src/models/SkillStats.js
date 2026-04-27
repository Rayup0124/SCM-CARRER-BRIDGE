/**
 * SkillStats — tracks how many times each skill has been used across all postings (normalized).
 * HR freely-written skills that appear >= 3 times automatically enter the posting suggestion list.
 */
const mongoose = require('mongoose');

const skillStatsSchema = new mongoose.Schema(
  {
    /** Normalized skill label, e.g. "Next.js", "Vue.js" */
    skill: { type: String, required: true, unique: true },

    /** How many times this skill appeared in all postings' skills arrays */
    count: { type: Number, default: 1, min: 1 },

    /**
     * Source type:
     *   fixed    — Admin-written fixed entries (e.g. COMMON_SKILL_SUGGESTIONS)
     *   dynamic  — HR freely written, auto-accumulated
     */
    source: { type: String, enum: ['fixed', 'dynamic'], default: 'dynamic' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SkillStats', skillStatsSchema);
