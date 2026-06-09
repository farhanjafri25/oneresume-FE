import { OnboardingState } from '@/lib/onboarding';
import { User } from '@/types';

export interface StepProps {
  state: OnboardingState;
  patch: (p: Partial<OnboardingState>) => void;
  next: () => void;
  back: () => void;
  user: User;
}
