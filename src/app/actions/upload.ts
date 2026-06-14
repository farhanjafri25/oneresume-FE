'use server';

import { cookies } from 'next/headers';
import { getMe } from '@/lib/api';
import { refreshResumeSurfaces } from './resumeCache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function uploadResumeAction(prevState: any, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { error: 'Please select a file to upload' };
    }
    
    if (file.size > 4 * 1024 * 1024) {
      return { error: 'File size must be less than 4MB' };
    }

    const user = await getMe();
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Check if we passed resumeId and variantId (if uploading a new version to an existing variant)
    let resumeId = formData.get('resumeId') as string;
    let variantId = formData.get('variantId') as string;
    // Public slug of the resume — only set when we create a new container below.
    let createdSlug: string | undefined;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    // If no resume exists yet (e.g. creating a new top-level resume card), we create a new masterpiece container
    if (!resumeId || !variantId) {
      const customName = formData.get('resumeName') as string;
      let rawName = file.name || 'resume';
      if (rawName.toLowerCase().endsWith('.pdf')) {
        rawName = rawName.slice(0, -4);
      }

      let title = rawName;

      if (customName && customName.trim().length > 0) {
        title = customName.trim();
        rawName = title;
      }

      const slug = rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const finalSlug = slug || `resume-${Date.now()}`;
      createdSlug = finalSlug;

      const resumeRes = await fetch(`${API_URL}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, slug: finalSlug, title })
      });

      if (!resumeRes.ok) {
        return { error: 'Failed to create or resolve resume container' };
      }

      const resumeData = await resumeRes.json();
      resumeId = resumeData.id;
      variantId = resumeData.variants[0].id;
    }

    // Now forward the file to the backend upload endpoint
    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('userId', user.id);
    uploadForm.append('resumeId', resumeId);
    uploadForm.append('variantId', variantId);

    const uploadRes = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadForm
    });

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      return { error: errorData.message || 'Failed to upload file' };
    }

    refreshResumeSurfaces(resumeId);
    // `slug` is only set when we created the resume container above; version
    // re-uploads leave it undefined (the onboarding flow always creates).
    return { success: true, resumeId, slug: createdSlug };

  } catch (err) {
    console.error('Upload Error:', err);
    return { error: 'An unexpected error occurred during upload' };
  }
}
