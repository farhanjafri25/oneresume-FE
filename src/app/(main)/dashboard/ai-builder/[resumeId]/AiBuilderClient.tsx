'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  Briefcase, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Save, 
  Download, 
  ExternalLink,
  ChevronRight,
  User,
  Wrench,
  Link2,
  Eye
} from 'lucide-react';
import { tailorResumeAction, createVariantAction, getThemesAction, previewResumeAction } from '@/app/actions/ai';
import styles from './AiBuilder.module.css';

interface AiBuilderClientProps {
  resumeId: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  vibe: string;
}

interface Experience {
  job_title: string;
  company: string;
  job_dates: string;
  job_location: string;
  job_bullet_1: string;
  job_bullet_2: string;
  job_bullet_3: string;
}

interface Education {
  degree: string;
  institution: string;
  edu_date: string;
  edu_location?: string;
}

interface TailoredData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string;
  experiences: Experience[];
  education: Education[];
}

export default function AiBuilderClient({ resumeId }: AiBuilderClientProps) {
  // Steps: 'jd_input' | 'loading' | 'editing' | 'success'
  const [step, setStep] = useState<'jd_input' | 'loading' | 'editing' | 'success'>('jd_input');
  
  const [jd, setJd] = useState('');
  const [loadingPhase, setLoadingPhase] = useState('Downloading PDF resume...');
  const [error, setError] = useState<string | null>(null);

  // Form Editing State
  const [formData, setFormData] = useState<TailoredData | null>(null);

  // Themes & Selection
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState('theme-1');

  // Variant naming configurations
  const [variantTitle, setVariantTitle] = useState('');
  const [variantSlug, setVariantSlug] = useState('');
  const [saving, setSaving] = useState(false);

  // Result parameters
  const [createdVariant, setCreatedVariant] = useState<{ fileUrl: string; slug: string } | null>(null);

  // Live HTML Layout Preview states
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load available themes from backend on startup
  useEffect(() => {
    getThemesAction().then((res) => {
      if (res && res.error) {
        setError(res.error);
      } else {
        setThemes(res);
      }
    });
  }, []);

  // Pre-fill JD if navigated from AI Match Reviewer
  useEffect(() => {
    const storedJd = sessionStorage.getItem('shared_jd');
    if (storedJd) {
      setJd(storedJd);
      sessionStorage.removeItem('shared_jd');
    }
  }, []);

  const updatePreviewHtml = async (themeId: string, data: TailoredData | null) => {
    if (!data) return;
    setPreviewLoading(true);
    try {
      const res = await previewResumeAction(themeId, data);
      if (!res.error && res.html) {
        setPreviewHtml(res.html);
      }
    } catch (err) {
      console.error('Failed to update layout preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Re-run preview whenever selectedThemeId changes
  useEffect(() => {
    if (step === 'editing' && formData) {
      updatePreviewHtml(selectedThemeId, formData);
    }
  }, [selectedThemeId, step]);

  // timed progress text rotation during Gemini compilation
  useEffect(() => {
    if (step !== 'loading') return;

    const phases = [
      { delay: 0, text: 'Downloading resume PDF from storage...' },
      { delay: 3000, text: 'Deconstructing resume layout using Gemini 2.5 Flash...' },
      { delay: 6500, text: 'Tailoring professional summary and highlighting keyword fits...' },
      { delay: 10000, text: 'Aligning experiences achievements and formatting work bullet points...' }
    ];

    const timers = phases.map((phase) => 
      setTimeout(() => {
        setLoadingPhase(phase.text);
      }, phase.delay)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [step]);

  // Step 1 Trigger: Run Gemini Tailoring API
  const handleTailor = async () => {
    if (!jd.trim()) return;

    setStep('loading');
    setError(null);

    try {
      const data = await tailorResumeAction(resumeId, jd);
      if (data.error) {
        setError(data.error);
        setStep('jd_input');
      } else {
        setFormData(data);
        
        // Auto-generate some default names for variant saving
        const companyMatched = data.experiences?.[0]?.company || 'Target';
        const cleanedCompany = companyMatched.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        setVariantTitle(`${companyMatched} Tailored Version`);
        setVariantSlug(`${cleanedCompany}-optimized`);
        
        setStep('editing');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during tailoring.');
      setStep('jd_input');
    }
  };

  // Step 2 Trigger: Generate PDF and Register Resume Variant
  const handleSaveVariant = async () => {
    if (!formData) return;
    if (!variantTitle.trim() || !variantSlug.trim()) {
      setError('Variant Title and Unique URL Slug are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await createVariantAction(
        resumeId,
        variantTitle.trim(),
        variantSlug.trim().toLowerCase(),
        selectedThemeId,
        formData
      );

      if (result.error) {
        setError(result.error);
      } else {
        setCreatedVariant(result);
        setStep('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Form field mutations
  const updateField = (key: keyof TailoredData, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [key]: value
    });
  };

  const updateExperience = (index: number, key: keyof Experience, value: string) => {
    if (!formData) return;
    const newExps = [...formData.experiences];
    newExps[index] = {
      ...newExps[index],
      [key]: value
    };
    updateField('experiences', newExps);
  };

  const updateEducation = (index: number, key: keyof Education, value: string) => {
    if (!formData) return;
    const newEdus = [...formData.education];
    newEdus[index] = {
      ...newEdus[index],
      [key]: value
    };
    updateField('education', newEdus);
  };

  // UI state renders
  if (step === 'jd_input') {
    return (
      <div className={styles.jdContainer} style={{ maxWidth: '900px' }}>
        <div className={styles.panelTitle}>
          <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          Create Tailored Resume Variant
        </div>
        <p className={styles.panelSubtitle} style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 24px' }}>
          Paste the Job Description, and Gemini will automatically tailor your CV content to fit the role.
        </p>

        {/* Step 1: Paste JD */}
        <div style={{ width: '100%', marginBottom: '20px' }}>
          <h3 className={styles.panelTitle} style={{ fontSize: '15px', marginBottom: '12px' }}>
            Paste Job Description (JD)
          </h3>
          <textarea
            className={styles.jdTextarea}
            placeholder="Paste Job Description (JD) here... E.g., 'We are looking for a Senior React Engineer with 4 years of experience, skilled in Next.js, TypeScript, and AWS deployment...'"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {error && (
          <div className={styles.errorAlert} style={{ width: '100%', marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          className={styles.actionBtn}
          style={{ width: '100%' }}
          onClick={handleTailor}
          disabled={!jd.trim()}
        >
          <Send size={16} />
          Tailor Resume Content
        </button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className={styles.panel} style={{ maxWidth: '700px', margin: '40px auto' }}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <h3 className={styles.loadingTitle}>Optimizing CV Text</h3>
          <p className={styles.loadingSubtitle}>{loadingPhase}</p>
        </div>
      </div>
    );
  }

  if (step === 'success' && createdVariant) {
    // Generate shareable link
    const trackingLink = `/dashboard/variants/${resumeId}`;
    const directLink = createdVariant.fileUrl;

    return (
      <div className={styles.successContainer}>
        <CheckCircle size={56} className={styles.successIcon} />
        <h2 className={styles.successTitle}>Resume Variant Generated!</h2>
        <p className={styles.successText}>
          Your resume was compiled using your chosen template, printed as a high-density, ATS-friendly PDF, and saved under variant <strong>"{variantTitle}"</strong>.
        </p>

        <div className={styles.buttonGroup}>
          <a href={directLink} target="_blank" rel="noopener noreferrer" className={styles.actionBtn}>
            <Download size={16} />
            Download tailored PDF
          </a>
          <button 
            type="button" 
            className={`${styles.actionBtn} ${styles.secondaryBtn}`}
            onClick={() => window.location.href = '/dashboard/variants'}
          >
            View Tailored Variants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      {/* LEFT COLUMN: Editing Wizard */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>
          <User size={20} style={{ color: 'var(--primary)' }} />
          Inspect & Edit Tailored Content
        </div>
        <p className={styles.panelSubtitle}>
          Gemini has rewritten your summary and experiences to align with the JD. Tweak any detail to perfection.
        </p>

        {formData && (
          <div className={styles.fieldsList}>
            {/* Contact info grid */}
            <div className={styles.experienceRow}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Full Name</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.name} 
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Job Title</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.title} 
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.experienceRow}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Email</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.email} 
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Phone</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.phone} 
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.experienceRow}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Location</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.location} 
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>LinkedIn Profile Link</span>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={formData.linkedin} 
                  onChange={(e) => updateField('linkedin', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.divider} />

            {/* Summary */}
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Professional Summary (Tailored)</span>
              <textarea 
                className={styles.textAreaField} 
                rows={3}
                value={formData.summary} 
                onChange={(e) => updateField('summary', e.target.value)}
              />
            </div>

            <div className={styles.divider} />

            {/* Work Experiences */}
            <div className={styles.panelTitle} style={{ fontSize: '16px', marginTop: '10px' }}>
              <Briefcase size={16} />
              Professional Experience
            </div>
            
            {formData.experiences.map((exp, idx) => (
              <div key={idx} className={styles.experienceCard}>
                <div className={styles.experienceRow}>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Job Title / Role</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_title} 
                      onChange={(e) => updateExperience(idx, 'job_title', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Company Name</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.company} 
                      onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.experienceRow}>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Dates Worked</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_dates} 
                      onChange={(e) => updateExperience(idx, 'job_dates', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Job Location</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_location} 
                      onChange={(e) => updateExperience(idx, 'job_location', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.bulletsContainer}>
                  <span className={styles.fieldLabel}>Optimized Achievements (JD Keywords Aligned)</span>
                  <div className={styles.bulletInputGroup}>
                    <span className={styles.bulletIndex}>B1</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_bullet_1} 
                      onChange={(e) => updateExperience(idx, 'job_bullet_1', e.target.value)}
                    />
                  </div>
                  <div className={styles.bulletInputGroup}>
                    <span className={styles.bulletIndex}>B2</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_bullet_2} 
                      onChange={(e) => updateExperience(idx, 'job_bullet_2', e.target.value)}
                    />
                  </div>
                  <div className={styles.bulletInputGroup}>
                    <span className={styles.bulletIndex}>B3</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={exp.job_bullet_3} 
                      onChange={(e) => updateExperience(idx, 'job_bullet_3', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className={styles.divider} />

            {/* Skills */}
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Technical Skills</span>
              <input 
                type="text" 
                className={styles.inputField} 
                value={formData.skills} 
                onChange={(e) => updateField('skills', e.target.value)}
                placeholder="React, TypeScript, Node.js..."
              />
            </div>

            <div className={styles.divider} />

            {/* Education */}
            <div className={styles.panelTitle} style={{ fontSize: '16px' }}>
              <GraduationCap size={16} />
              Education History
            </div>

            {formData.education.map((edu, idx) => (
              <div key={idx} className={styles.experienceCard}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Degree received</span>
                  <input 
                    type="text" 
                    className={styles.inputField} 
                    value={edu.degree} 
                    onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                  />
                </div>
                <div className={styles.experienceRow}>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Institution</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={edu.institution} 
                      onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>Graduation Date</span>
                    <input 
                      type="text" 
                      className={styles.inputField} 
                      value={edu.edu_date} 
                      onChange={(e) => updateEducation(idx, 'edu_date', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Vibe selection & PDF Save details */}
      <div className={styles.panel} style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
        <div className={styles.panelTitle}>
          <Wrench size={20} style={{ color: 'var(--primary)' }} />
          Save Variant
        </div>
        <p className={styles.panelSubtitle}>
          Specify the new variant's details and save your tailored resume.
        </p>

        {/* Live Layout Preview Card */}
        <div style={{ marginTop: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className={styles.fieldLabel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} style={{ color: 'var(--primary)' }} />
              Live HTML Theme Preview
            </span>
            <button
              type="button"
              className={styles.clearBtn}
              style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}
              onClick={() => updatePreviewHtml(selectedThemeId, formData)}
              disabled={previewLoading}
            >
              {previewLoading ? 'Syncing...' : 'Sync changes'}
            </button>
          </div>
          <div style={{ 
            width: '100%', 
            height: '280px', 
            background: '#ffffff', 
            borderRadius: 'var(--radius-sm)', 
            overflow: 'hidden', 
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            {previewLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Refreshing layout...
              </div>
            )}
            {previewHtml ? (
              <iframe
                title="Theme Live Preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                style={{
                  width: '200%',
                  height: '200%',
                  border: 'none',
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                  background: '#ffffff'
                }}
              />
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--text-secondary)', 
                fontSize: '12px',
                background: 'var(--surface)'
              }}>
                Generating preview layout...
              </div>
            )}
          </div>
        </div>

        {/* Config inputs */}
        <div className={styles.saveConfig}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Variant Title</span>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="E.g., Google Frontend Resume"
              value={variantTitle}
              onChange={(e) => setVariantTitle(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Unique URL Slug</span>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="E.g., google-frontend"
              value={variantSlug}
              onChange={(e) => setVariantSlug(e.target.value)}
            />
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleSaveVariant}
            disabled={saving || !variantTitle.trim() || !variantSlug.trim()}
          >
            <Save size={16} />
            {saving ? 'Generating PDF...' : 'Build & Save Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}
