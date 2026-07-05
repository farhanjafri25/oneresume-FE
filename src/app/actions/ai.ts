'use server';

import { cookies } from 'next/headers';
import type { TailoredData } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function analyzeResumeAction(resumeId: string, jd: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ jd }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'Analysis failed. Please check your network and try again.' };
    }

    return await res.json();
  } catch (err) {
    console.error('Analyze Resume Error:', err);
    return { error: 'An unexpected error occurred while communicating with the AI server.' };
  }
}

export async function generalScanResumeAction(resumeId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/general-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'General Scan failed. Please check your network and try again.' };
    }

    return await res.json();
  } catch (err) {
    console.error('General Scan Error:', err);
    return { error: 'An unexpected error occurred while communicating with the AI server.' };
  }
}

export async function tailorResumeAction(resumeId: string, jd: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/tailor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ jd }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'Tailoring failed. Please check your network and try again.' };
    }

    return await res.json();
  } catch (err) {
    console.error('Tailor Resume Error:', err);
    return { error: 'An unexpected error occurred while communicating with the AI tailoring server.' };
  }
}

export async function getResumeContentAction(resumeId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/content`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // 404 = the resume has no parsed content yet (or the endpoint hasn't
    // shipped). Callers show an empty state rather than a retryable error.
    if (res.status === 404) {
      return {
        error: "This resume's content hasn't been processed yet.",
        notAvailable: true,
      };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'Failed to load resume content. Please try again.' };
    }

    return await res.json();
  } catch (err) {
    console.error('Get Resume Content Error:', err);
    return { error: 'An unexpected error occurred while loading resume content.' };
  }
}

export async function createVariantAction(
  resumeId: string,
  title: string,
  slug: string,
  themeId: string,
  tailoredData: TailoredData,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/${resumeId}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title, slug, themeId, tailoredData }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData.message || 'Variant creation failed. Please check your inputs.' };
    }

    return await res.json();
  } catch (err) {
    console.error('Create Variant Error:', err);
    return { error: 'An unexpected error occurred while generating the resume PDF.' };
  }
}

export async function getThemesAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/themes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { error: 'Failed to fetch themes' };
    }

    return await res.json();
  } catch (err) {
    console.error('Get Themes Error:', err);
    return { error: 'An unexpected error occurred while loading themes.' };
  }
}

export async function previewResumeAction(
  themeId: string,
  tailoredData: TailoredData,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized. Please log in first.' };
    }

    const res = await fetch(`${API_URL}/resumes/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ themeId, tailoredData }),
    });

    if (!res.ok) {
      return { error: 'Failed to generate preview' };
    }

    return await res.json();
  } catch (err) {
    console.error('Preview Resume Error:', err);
    return { error: 'An unexpected error occurred while loading layout preview.' };
  }
}
