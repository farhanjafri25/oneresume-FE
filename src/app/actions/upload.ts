'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getMe } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function uploadResumeAction(prevState: any, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      return { error: 'Please select a file to upload' };
    }

    const user = await getMe();
    
    // Check if we passed resumeId and variantId (if uploading a new version to an existing variant)
    let resumeId = formData.get('resumeId') as string;
    let variantId = formData.get('variantId') as string;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return { error: 'Unauthorized' };
    }

    // If no resume exists yet, we create a default one first
    if (!resumeId || !variantId) {
      // 1. Create a resume
      const slug = `resume-${Date.now()}`;
      const resumeRes = await fetch(`${API_URL}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, slug })
      });

      if (!resumeRes.ok) {
        return { error: 'Failed to create resume container' };
      }

      const resumeData = await resumeRes.json();
      resumeId = resumeData.id;
      // The backend auto-creates a 'default' variant
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

    revalidatePath('/dashboard');
    return { success: true };

  } catch (err) {
    console.error('Upload Error:', err);
    return { error: 'An unexpected error occurred during upload' };
  }
}
