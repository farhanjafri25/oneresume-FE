import { describe, expect, it } from 'vitest';
import { getAuthErrorState } from './authErrorState';

describe('getAuthErrorState', () => {
  it('shows Google errors without marking credential fields invalid', () => {
    const state = getAuthErrorState({
      formError: null,
      googleError: 'Google login failed',
    });

    expect(state).toEqual({
      alertError: 'Google login failed',
      credentialFieldsInvalid: false,
    });
  });

  it('marks credential fields invalid for form action errors', () => {
    const state = getAuthErrorState({
      formError: 'Invalid email or password',
      googleError: null,
    });

    expect(state).toEqual({
      alertError: 'Invalid email or password',
      credentialFieldsInvalid: true,
    });
  });
});
