import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BarChart2, Globe, Eye, Download, ShieldAlert, Award } from 'lucide-react';
import { getResumeAnalyticsAction } from '@/app/actions/resume';
import styles from './Analytics.module.css';
import AnalyticsChart from './AnalyticsChart';

// Helper to format dates cleanly
function formatDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Convert country code to emoji flag
function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

export default async function ResumeAnalyticsPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;

  // Fetch metrics from backend using Server Action
  const analyticsData = await getResumeAnalyticsAction(resumeId);

  if (analyticsData.error) {
    return (
      <div className={styles.container}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className={styles.emptyState}>
          <ShieldAlert size={48} className={styles.emptyStateIcon} />
          <h2 className={styles.emptyStateTitle}>Failed to Load Analytics</h2>
          <p>{analyticsData.error}</p>
        </div>
      </div>
    );
  }

  const { summary, referrers, timeline, campaigns, recentLogs } = analyticsData;

  const totalViews = summary.totalViews || 0;
  const uniqueViews = summary.uniqueViews || 0;
  const desktop = summary.desktop || 0;
  const mobile = summary.mobile || 0;
  const tablet = summary.tablet || 0;

  // Calculate percentages
  const maxViews = Math.max(...timeline.map((t: any) => t.count), 1);
  const maxReferrals = Math.max(...referrers.map((r: any) => r.count), 1);
  const maxCampaigns = Math.max(...campaigns.map((c: any) => c.count), 1);
  const deviceTotal = (desktop + mobile + tablet) || 1;
  const desktopPct = Math.round((desktop / deviceTotal) * 100);
  const mobilePct = Math.round((mobile / deviceTotal) * 100);
  const tabletPct = Math.round((tablet / deviceTotal) * 100);



  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backBtn}>
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Resume Insights</h1>
        <p className={styles.subtitle}>Track recruiter activity and engagement metrics below.</p>
      </header>

      {/* Summary Scorecards */}
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Total Views</span>
          <span className={styles.cardValue}>{totalViews}</span>
          <span className={styles.cardSubtext}>Lifetime link impressions</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Unique Views</span>
          <span className={styles.cardValue}>{uniqueViews}</span>
          <span className={styles.cardSubtext}>Individual recruiter hits</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Desktop Visitors</span>
          <span className={styles.cardValue}>{desktopPct}%</span>
          <span className={styles.cardSubtext}>{desktop} sessions recorded</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Mobile Visitors</span>
          <span className={styles.cardValue}>{mobilePct + tabletPct}%</span>
          <span className={styles.cardSubtext}>{mobile + tablet} on-the-go sessions</span>
        </div>
      </div>

      {totalViews === 0 ? (
        <div className={styles.emptyState}>
          <BarChart2 size={48} className={styles.emptyStateIcon} />
          <h2 className={styles.emptyStateTitle}>No Traffic Recorded Yet</h2>
          <p>Share your resume link with recruiters to begin capturing visitor intelligence!</p>
        </div>
      ) : (
        <>
          {/* Custom SVG Line Chart Component */}
          <AnalyticsChart timeline={timeline} />

          <div className={styles.detailGrid}>
            {/* Traffic Sources */}
            <div className={styles.card}>
              <h2 className={styles.chartTitle} style={{ marginBottom: '20px' }}>Traffic Sources</h2>
              <div className={styles.sourceList}>
                {referrers.map((ref: any, idx: number) => {
                  const percent = Math.round((ref.count / maxReferrals) * 100) || 5;
                  return (
                    <div key={idx} className={styles.sourceItem}>
                      <div className={styles.sourceHeader}>
                        <span className={styles.sourceName}>{ref.source}</span>
                        <span className={styles.sourceCount}>{ref.count} views</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBar} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
                {referrers.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No referrer data available.</p>
                )}
              </div>
            </div>

            {/* Campaign Links Performance */}
            <div className={styles.card}>
              <h2 className={styles.chartTitle} style={{ marginBottom: '20px' }}>Link Performance (per Role/App)</h2>
              <div className={styles.sourceList}>
                {campaigns.map((camp: any, idx: number) => {
                  const percent = Math.round((camp.count / maxCampaigns) * 100) || 5;
                  return (
                    <div key={idx} className={styles.sourceItem}>
                      <div className={styles.sourceHeader}>
                        <span className={styles.sourceName}>{camp.label}</span>
                        <span className={styles.sourceCount}>{camp.count} views</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBar} style={{ width: `${percent}%`, backgroundColor: '#f59e0b' }} />
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No targeted link views recorded yet.</p>
                )}
              </div>
            </div>

            {/* Device Profile */}
            <div className={styles.card}>
              <h2 className={styles.chartTitle} style={{ marginBottom: '20px' }}>Device Distribution</h2>
              <div className={styles.sourceList}>
                <div className={styles.sourceItem}>
                  <div className={styles.sourceHeader}>
                    <span className={styles.sourceName}>🖥️ Desktop Sessions</span>
                    <span className={styles.sourceCount}>{desktop} views ({desktopPct}%)</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBar} style={{ width: `${desktopPct}%` }} />
                  </div>
                </div>

                <div className={styles.sourceItem}>
                  <div className={styles.sourceHeader}>
                    <span className={styles.sourceName}>📱 Mobile Sessions</span>
                    <span className={styles.sourceCount}>{mobile} views ({mobilePct}%)</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBar} style={{ width: `${mobilePct}%`, backgroundColor: '#818cf8' }} />
                  </div>
                </div>

                <div className={styles.sourceItem}>
                  <div className={styles.sourceHeader}>
                    <span className={styles.sourceName}>📟 Tablet Sessions</span>
                    <span className={styles.sourceCount}>{tablet} views ({tabletPct}%)</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBar} style={{ width: `${tabletPct}%`, backgroundColor: '#34d399' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Visitor Logs */}
          <div className={styles.card} style={{ marginBottom: '0px' }}>
            <h2 className={styles.chartTitle}>Recent Recruiter Visits</h2>
            <div className={styles.tableContainer}>
              <table className={styles.logTable}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Referrer Source</th>
                    <th>Application Link</th>
                    <th>Browser</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.viewedAt)}</td>
                      <td style={{ fontWeight: '500' }}>{log.referer}</td>
                      <td style={{ color: log.label ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: log.label ? '500' : '400' }}>
                        {log.label || 'Default / General'}
                      </td>
                      <td>{log.browser}</td>
                      <td>
                        <span className={styles.flag}>{getFlagEmoji(log.country)}</span>
                        <span>{log.country || 'Global'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
