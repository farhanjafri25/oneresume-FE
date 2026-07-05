'use client';

import React from 'react';
import {
  Briefcase,
  CaretRight,
  GraduationCap,
  IdentificationCard,
  TextAlignLeft,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import { TailoredData, Experience, Education } from '@/types';
import styles from './ResumeContentEditor.module.css';

const BULLET_KEYS: (keyof Experience)[] = [
  'job_bullet_1',
  'job_bullet_2',
  'job_bullet_3',
  'job_bullet_4',
  'job_bullet_5',
];

interface ResumeContentEditorProps {
  value: TailoredData;
  onChange: (next: TailoredData) => void;
}

/**
 * Controlled form over the structured resume content: the collapsible
 * contact / summary / experience / skills / education sections shared by the
 * AI builder's edit step and the resume editor. Pure `value` in, `onChange`
 * out — parents own layout, preview and save.
 */
export default function ResumeContentEditor({
  value,
  onChange,
}: ResumeContentEditorProps) {
  const updateField = (key: keyof TailoredData, next: unknown) => {
    onChange({ ...value, [key]: next });
  };

  const updateExperience = (
    index: number,
    key: keyof Experience,
    next: string,
  ) => {
    const newExps = [...value.experiences];
    newExps[index] = { ...newExps[index], [key]: next };
    updateField('experiences', newExps);
  };

  const updateEducation = (
    index: number,
    key: keyof Education,
    next: string,
  ) => {
    const newEdus = [...value.education];
    newEdus[index] = { ...newEdus[index], [key]: next };
    updateField('education', newEdus);
  };

  return (
    <>
      <details className={styles.sectionGroup} open>
        <summary className={styles.sectionGroupHeader}>
          <IdentificationCard size={18} className={styles.sectionIcon} />
          Contact details
          <CaretRight size={16} className={styles.caret} />
        </summary>
        <div className={styles.sectionBody}>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Full name</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Job title</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Phone</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Location</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>LinkedIn</span>
              <input
                type="text"
                className={styles.inputField}
                value={value.linkedin}
                onChange={(e) => updateField('linkedin', e.target.value)}
              />
            </div>
          </div>
        </div>
      </details>

      <details className={styles.sectionGroup} open>
        <summary className={styles.sectionGroupHeader}>
          <TextAlignLeft size={18} className={styles.sectionIcon} />
          Professional summary
          <CaretRight size={16} className={styles.caret} />
        </summary>
        <div className={styles.sectionBody}>
          <textarea
            className={styles.textAreaField}
            rows={4}
            value={value.summary}
            onChange={(e) => updateField('summary', e.target.value)}
          />
        </div>
      </details>

      <details className={styles.sectionGroup} open>
        <summary className={styles.sectionGroupHeader}>
          <Briefcase size={18} className={styles.sectionIcon} />
          Experience
          <span className={styles.sectionCount}>
            {value.experiences.length}
          </span>
          <CaretRight size={16} className={styles.caret} />
        </summary>
        <div className={styles.sectionBody}>
          {value.experiences.map((exp, idx) => (
            <div key={idx} className={styles.experienceCard}>
              <div className={styles.fieldGrid}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Role</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={exp.job_title}
                    onChange={(e) =>
                      updateExperience(idx, 'job_title', e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Company</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={exp.company}
                    onChange={(e) =>
                      updateExperience(idx, 'company', e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Dates</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={exp.job_dates}
                    onChange={(e) =>
                      updateExperience(idx, 'job_dates', e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Location</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={exp.job_location}
                    onChange={(e) =>
                      updateExperience(idx, 'job_location', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.achievements}>
                <span className={styles.fieldLabel}>Achievements</span>
                {BULLET_KEYS.filter((key) => exp[key] !== undefined).map(
                  (key) => (
                    <div key={key} className={styles.bulletRow}>
                      <span className={styles.bulletDot} />
                      <input
                        type="text"
                        className={styles.inputField}
                        value={(exp[key] as string) ?? ''}
                        onChange={(e) =>
                          updateExperience(idx, key, e.target.value)
                        }
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </details>

      <details className={styles.sectionGroup}>
        <summary className={styles.sectionGroupHeader}>
          <Wrench size={18} className={styles.sectionIcon} />
          Skills
          <CaretRight size={16} className={styles.caret} />
        </summary>
        <div className={styles.sectionBody}>
          <input
            type="text"
            className={styles.inputField}
            value={value.skills}
            onChange={(e) => updateField('skills', e.target.value)}
            placeholder="React, TypeScript, Node.js…"
          />
          <span className={styles.skillsHint}>
            Separate skills with commas.
          </span>
        </div>
      </details>

      <details className={styles.sectionGroup}>
        <summary className={styles.sectionGroupHeader}>
          <GraduationCap size={18} className={styles.sectionIcon} />
          Education
          <span className={styles.sectionCount}>{value.education.length}</span>
          <CaretRight size={16} className={styles.caret} />
        </summary>
        <div className={styles.sectionBody}>
          {value.education.map((edu, idx) => (
            <div key={idx} className={styles.experienceCard}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Degree</span>
                <input
                  type="text"
                  className={styles.inputField}
                  value={edu.degree}
                  onChange={(e) =>
                    updateEducation(idx, 'degree', e.target.value)
                  }
                />
              </div>
              <div className={styles.fieldGrid}>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Institution</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={edu.institution}
                    onChange={(e) =>
                      updateEducation(idx, 'institution', e.target.value)
                    }
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Graduation</span>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={edu.edu_date}
                    onChange={(e) =>
                      updateEducation(idx, 'edu_date', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
