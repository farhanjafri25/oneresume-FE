import React from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getMe } from '@/lib/api';
import VersionListClient from './VersionListClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default async function ResumeVersionsPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const { resumeId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await getMe();
  } catch (err) {
    redirect('/login');
  }

  // Fetch the specific resume container by ID (includes variants & versions)
  const res = await fetch(`${API_URL}/resumes/${resumeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    notFound();
  }

  const resume = await res.json();

  return <VersionListClient resume={resume} username={user.username} />;
}
