/**
 * Client service to communicate with full-stack server authentication endpoints (/api/auth/*)
 */

export interface CheckUserResult {
  success: boolean;
  phone?: string;
  exists?: boolean;
  hasPassword?: boolean;
  error?: string;
}

export interface SendOtpResult {
  success: boolean;
  sessionId?: string;
  isAlreadyRegistered?: boolean;
  error?: string;
  message?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  verificationToken?: string;
  error?: string;
  message?: string;
}

export interface AuthActionResult {
  success: boolean;
  token?: string;
  account?: any;
  isAlreadyRegistered?: boolean;
  isLocked?: boolean;
  error?: string;
  message?: string;
}

const TOKEN_KEY = 'bharatmandi_session_token';

export function getStoredSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredSessionToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Check if a mobile number is registered and has a password on the server
 */
export async function checkUserOnServer(phone: string): Promise<CheckUserResult> {
  try {
    const res = await fetch('/api/auth/check-user', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone }),
    });
    return await res.json();
  } catch (err) {
    console.error('checkUserOnServer exception:', err);
    return { success: false, error: 'Could not connect to server. Please try again.' };
  }
}

/**
 * Request 2Factor.in OTP from backend
 */
export async function sendOtpOnServer(
  phone: string,
  purpose: 'signup' | 'forgot-password'
): Promise<SendOtpResult> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, purpose }),
    });
    return await res.json();
  } catch (err) {
    console.error('sendOtpOnServer exception:', err);
    return { success: false, error: 'Could not send OTP, please try again' };
  }
}

/**
 * Verify 2Factor.in OTP via backend
 */
export async function verifyOtpOnServer(
  phone: string,
  sessionId: string,
  otp: string
): Promise<VerifyOtpResult> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, sessionId, otp }),
    });
    return await res.json();
  } catch (err) {
    console.error('verifyOtpOnServer exception:', err);
    return { success: false, error: 'Could not verify OTP, please try again' };
  }
}

/**
 * Register password for new account on server
 */
export async function registerPasswordOnServer(payload: {
  phone: string;
  password: string;
  confirmPassword: string;
  verificationToken: string;
  fullName?: string;
  shopOrVillage?: string;
  licenseOrCrop?: string;
  shopAddress?: string;
  shopNumber?: string;
  marketName?: string;
  selectedCommodities?: string[];
}): Promise<AuthActionResult> {
  try {
    const res = await fetch('/api/auth/register-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data: AuthActionResult = await res.json();
    if (data.success && data.token) {
      setStoredSessionToken(data.token);
    }
    return data;
  } catch (err) {
    console.error('registerPasswordOnServer exception:', err);
    return { success: false, error: 'Could not save password. Please try again.' };
  }
}

/**
 * Reset password for existing account on server
 */
export async function resetPasswordOnServer(payload: {
  phone: string;
  newPassword: string;
  confirmNewPassword: string;
  verificationToken: string;
}): Promise<AuthActionResult> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('resetPasswordOnServer exception:', err);
    return { success: false, error: 'Could not reset password. Please try again.' };
  }
}

/**
 * Login with mobile number and password on server
 */
export async function loginOnServer(phone: string, password: string): Promise<AuthActionResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, password }),
    });
    const data: AuthActionResult = await res.json();
    if (data.success && data.token) {
      setStoredSessionToken(data.token);
    }
    return data;
  } catch (err) {
    console.error('loginOnServer exception:', err);
    return { success: false, error: 'Could not connect to authentication server.' };
  }
}

/**
 * Logout and invalidate session on server
 */
export async function logoutOnServer(): Promise<{ success: boolean; message?: string }> {
  try {
    const token = getStoredSessionToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    }
  } catch (err) {
    console.error('logoutOnServer exception:', err);
  } finally {
    setStoredSessionToken('');
  }
  return { success: true };
}

/**
 * Verify active session with server
 */
export async function verifySessionOnServer(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const token = getStoredSessionToken();
    if (!token) {
      return { success: false, error: 'No active session.' };
    }
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error('verifySessionOnServer exception:', err);
    return { success: false, error: 'Session verification failed.' };
  }
}
