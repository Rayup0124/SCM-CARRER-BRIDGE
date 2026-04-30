import { type FormEvent, useState, useEffect, type KeyboardEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import api from '../../services/api';
import { COMMON_SKILL_SUGGESTIONS } from '../../constants/profileOptions';
import { normalizeTargetedProgrammes } from '../../utils/programmeMatch';
import { normalizeSkillLabel, normalizeSkillsArray, skillCanonicalKey } from '../../utils/skillNormalize';

type InternshipDetail = {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  skills: string[];
  targetedProgrammes: string[];
  status: string;
  isDraft: boolean;
  requiredAttachments: string[];
};

const ALL_ATTACHMENT_TYPES = ['Resume', 'Portfolio', 'Transcript', 'Cover Letter', 'Certifications', 'Other'];

const PROGRAMMES = [
  'Bachelor of Computer Science (Hons)',
  'Bachelor of Arts in Industrial Design (Honours)',
  'Bachelor of Arts (Hons.) in Creative Digital Media',
  'Bachelor of Mobile Game Development (Honours)',
];

const CompanyEditInternshipPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    api
      .get('/internships/skills/popular?minCount=3')
      .then((res) => setPopularSkills(res.data))
      .catch(() => {});
  }, []);

  const allSuggestions = [...COMMON_SKILL_SUGGESTIONS, ...popularSkills];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    duration: '',
    skills: [] as string[],
    targetedProgrammes: [] as string[],
    requiredAttachments: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');
  const [customAttachment, setCustomAttachment] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get<InternshipDetail>(`/internships/company/me/${id}`)
      .then((res) => {
        if (cancelled) return;
        const d = res.data;
        setIsDraft(d.isDraft || false);
        const rawAttachments = Array.isArray(d.requiredAttachments) ? d.requiredAttachments : [];
        const customAttachments = rawAttachments.filter(
          (a: string) => a !== 'Other' && !ALL_ATTACHMENT_TYPES.includes(a),
        );
        const standardAttachments = rawAttachments.filter(
          (a: string) => a === 'Other' || ALL_ATTACHMENT_TYPES.includes(a),
        );
        setFormData({
          title: d.title || '',
          description: d.description || '',
          location: d.location || '',
          duration: d.duration || '',
          skills: normalizeSkillsArray(Array.isArray(d.skills) ? d.skills : []),
          targetedProgrammes: normalizeTargetedProgrammes(
            Array.isArray(d.targetedProgrammes) ? d.targetedProgrammes : [],
          ),
          requiredAttachments: [...standardAttachments, ...(customAttachments.length > 0 ? ['Other'] : [])],
        });
        if (customAttachments.length > 0) {
          setCustomAttachment(customAttachments[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load internship');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgrammeToggle = (programme: string) => {
    setFormData((prev) => ({
      ...prev,
      targetedProgrammes: prev.targetedProgrammes.includes(programme)
        ? prev.targetedProgrammes.filter((p) => p !== programme)
        : [...prev.targetedProgrammes, programme],
    }));
  };

  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSkillInput('');
      return;
    }
    const label = normalizeSkillLabel(trimmed);
    if (!label) {
      setSkillInput('');
      return;
    }
    const key = skillCanonicalKey(label);
    setFormData((prev) => {
      if (prev.skills.some((s) => skillCanonicalKey(s) === key)) return prev;
      return { ...prev, skills: [...prev.skills, label] };
    });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = async (event: FormEvent, publishDraft: boolean = false) => {
    event.preventDefault();
    if (!id) return;
    setError('');

    if (!publishDraft && formData.skills.length === 0) {
      setError('Add at least one required skill.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put(`/internships/${id}`, {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        targetedProgrammes: formData.targetedProgrammes,
        location: formData.location,
        duration: formData.duration,
        isDraft: publishDraft ? false : isDraft,
        isPublished: publishDraft ? true : undefined,
        requiredAttachments: formData.requiredAttachments.includes('Other')
          ? [...formData.requiredAttachments.filter((t) => t !== 'Other'), customAttachment || 'Other']
          : formData.requiredAttachments,
      });

      alert(publishDraft ? 'Internship published!' : 'Position updated successfully!');
      navigate('/company/dashboard');
    } catch (err: unknown) {
      console.error('Failed to update internship:', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || (err instanceof Error ? err.message : 'Failed to update position. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Edit Position" subtitle="Update internship details.">
        <p className="py-12 text-center text-slate-500">Loading...</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Edit Position" subtitle="Update internship details and requirements.">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/company/dashboard" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            ← Back to Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4 border-b border-slate-200 pb-8">
            <h3 className="text-lg font-semibold text-slate-900">1. Overview</h3>
            <label className="block text-sm font-medium text-slate-700">
              Internship Title
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="e.g., Frontend Developer Intern"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                rows={4}
                placeholder="Describe the role, responsibilities, and learning opportunities..."
                required
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Location
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g., Kuching"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Duration
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g., 6 months"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 border-b border-slate-200 py-8">
            <h3 className="text-lg font-semibold text-slate-900">2. Skills & Toolkit</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Required skills</label>
              <p className="mb-2 text-xs text-slate-500">
                Suggested skills (click to add). You can still type your own below.
              </p>
              <div className="mb-3 flex flex-wrap gap-2">
                {allSuggestions
                  .filter((s) => !formData.skills.some((x) => skillCanonicalKey(x) === skillCanonicalKey(s)))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-sky-400 hover:bg-sky-200 hover:text-sky-800"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={() => skillInput && addSkill(skillInput)}
                  placeholder={formData.skills.length === 0 ? 'Type a skill and press Enter or comma' : ''}
                  className="min-w-[160px] flex-1 bg-transparent py-0.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Type a skill and press Enter or comma to add.</p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Target programmes
              <div className="mt-2 space-y-2">
                {PROGRAMMES.map((programme) => (
                  <label key={programme} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.targetedProgrammes.includes(programme)}
                      onChange={() => handleProgrammeToggle(programme)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600"
                    />
                    <span>{programme}</span>
                  </label>
                ))}
              </div>
            </label>
          </div>

          <div className="space-y-4 py-8">
            <h3 className="text-lg font-semibold text-slate-900">3. Required Documents</h3>
            <p className="text-sm text-slate-600">
              Select the documents applicants must submit when applying. Leave all unchecked if no specific documents are required.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {ALL_ATTACHMENT_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    formData.requiredAttachments.includes(type)
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.requiredAttachments.includes(type)}
                    onChange={() => {
                      if (type === 'Other') {
                        setFormData((prev) => ({
                          ...prev,
                          requiredAttachments: prev.requiredAttachments.includes('Other')
                            ? prev.requiredAttachments.filter((t) => t !== 'Other')
                            : [...prev.requiredAttachments, 'Other'],
                        }));
                        if (!formData.requiredAttachments.includes('Other')) {
                          setCustomAttachment('');
                        }
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          requiredAttachments: prev.requiredAttachments.includes(type)
                            ? prev.requiredAttachments.filter((t) => t !== type)
                            : [...prev.requiredAttachments, type],
                        }));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600"
                  />
                  <span className="text-sm font-medium text-slate-700">{type}</span>
                </label>
              ))}
            </div>

            {formData.requiredAttachments.includes('Other') && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Describe the custom document type:</p>
                <input
                  type="text"
                  value={customAttachment}
                  onChange={(e) => setCustomAttachment(e.target.value)}
                  placeholder="e.g. Company-specific form, Image portfolio, etc."
                  className="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}

            {formData.requiredAttachments.length > 0 && (
              <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
                <p className="text-xs font-semibold text-sky-700">Students will be asked to upload:</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {formData.requiredAttachments.map((t) => (
                    <span key={t} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                      {t === 'Other' && customAttachment ? customAttachment : t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <Link
              to="/company/dashboard"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <div className="flex gap-2">
              {isDraft && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as FormEvent, true)}
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-400"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-400"
              >
                {isSubmitting ? 'Saving...' : isDraft ? 'Save & Stay Draft' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}
      </div>
    </PageShell>
  );
};

export default CompanyEditInternshipPage;
