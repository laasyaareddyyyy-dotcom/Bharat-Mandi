import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Admin App on Server
const adminApp = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    })
  : getApp();

// Admin Firestore instance bypasses client firestore.rules completely
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');

// 2Factor.in API & Strict JWT Environment Variables
const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '81f437aa-c9ff-11f1-af74-0200cd936042';
const TWOFACTOR_TEMPLATE_NAME = process.env.TWOFACTOR_TEMPLATE_NAME || 'BharatMandiOTP';
const JWT_SECRET = process.env.JWT_SECRET || '';

// Strict Requirement 1: JWT signing secret MUST come from server env var (min 32 chars)
if (!JWT_SECRET || JWT_SECRET.trim().length < 32) {
  console.error('[FATAL ERROR] JWT_SECRET environment variable is missing or less than 32 characters long!');
  throw new Error('FATAL: JWT_SECRET environment variable is missing or less than 32 characters long. The authentication server cannot start.');
}

export interface AuthSession {
  sessionId: string;
  phone: string;
  purpose: 'signup' | 'forgot-password';
  createdAt: number;
  attempts: number;
  verified: boolean;
  verificationToken: string | null;
  used: boolean;
}

export interface OtpRateLimit {
  phone?: string;
  requestTimestamps: number[];
  lastRequestAt: number;
}

export interface LoginAttempt {
  phone?: string;
  failedAttempts: number;
  lockedUntil: number;
}

/**
 * Clean & validate 10-digit Indian mobile number (must start with 6, 7, 8, or 9)
 */
export function cleanAndValidatePhone(rawPhone: string): { isValid: boolean; cleanPhone: string; error?: string } {
  if (!rawPhone) {
    return { isValid: false, cleanPhone: '', error: 'Please enter a mobile number.' };
  }
  const digits = rawPhone.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      cleanPhone: digits,
      error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).',
    };
  }
  return { isValid: true, cleanPhone: digits };
}

/**
 * Extract client IP address for IP rate limiting
 */
export function extractClientIp(req: any): string {
  if (!req) return '127.0.0.1';
  const rawHeader = req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'];
  if (typeof rawHeader === 'string' && rawHeader.trim().length > 0) {
    return rawHeader.split(',')[0].trim().replace(/[^a-zA-Z0-9._:-]/g, '');
  }
  return (req.ip || req.socket?.remoteAddress || '127.0.0.1').replace(/[^a-zA-Z0-9._:-]/g, '');
}

/**
 * IP-based Rate Limiting in Firestore (ipRateLimits/{action_sanitizedIp})
 * - send-otp: max 5 requests per IP per 15 minutes
 * - login: max 10 requests per IP per 15 minutes
 */
export async function checkIpRateLimit(
  req: any,
  action: 'send-otp' | 'login'
): Promise<{ allowed: boolean; error?: string }> {
  const clientIp = extractClientIp(req);
  const sanitizedIpKey = clientIp.replace(/[\/.:]/g, '_');
  const docId = `${action}_${sanitizedIpKey}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxLimit = action === 'send-otp' ? 5 : 10;

  try {
    const docRef = db.collection('ipRateLimits').doc(docId);
    const snap = await docRef.get();
    let timestamps: number[] = [];

    if (snap.exists) {
      const data = snap.data();
      if (Array.isArray(data?.timestamps)) {
        timestamps = data.timestamps.filter((t: number) => now - t < windowMs);
      }
    }

    if (timestamps.length >= maxLimit) {
      const oldestInWindow = Math.min(...timestamps);
      const remainingSecs = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);
      return {
        allowed: false,
        error: `Too many ${action === 'send-otp' ? 'OTP' : 'login'} requests from this IP address (${clientIp}). Please wait ${Math.max(1, remainingSecs)} seconds before trying again.`,
      };
    }

    timestamps.push(now);
    await docRef.set({ ip: clientIp, action, timestamps, updatedAt: now }, { merge: true });
    return { allowed: true };
  } catch (err) {
    console.error('[Server Auth] IP rate limit check error:', err);
  }
  return { allowed: true };
}

/**
 * Get account record from Firestore using Admin SDK
 */
export async function getAccountByPhone(cleanPhone: string): Promise<any | null> {
  if (!cleanPhone || cleanPhone.length !== 10) return null;

  try {
    const snap = await db.collection('registeredAccounts').doc(cleanPhone).get();
    if (snap.exists) {
      return snap.data();
    }
  } catch (err) {
    console.error('[Server Auth] Error fetching account from Firestore Admin:', err);
  }
  return null;
}

/**
 * Save account record to Firestore using Admin SDK
 */
export async function saveAccountRecord(cleanPhone: string, accountData: any): Promise<boolean> {
  try {
    const payload = {
      ...accountData,
      phoneNumber: cleanPhone,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('registeredAccounts').doc(cleanPhone).set(payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[Server Auth] Error saving account to Firestore Admin:', err);
    return false;
  }
}

/**
 * Auth Sessions persistence in Firestore: authSessions/{sessionId}
 */
export async function getAuthSessionFromFirestore(sessionId: string): Promise<AuthSession | null> {
  if (!sessionId) return null;
  try {
    const snap = await db.collection('authSessions').doc(sessionId).get();
    if (snap.exists) {
      return snap.data() as AuthSession;
    }
  } catch (err) {
    console.error('[Server Auth] Error reading authSession from Firestore:', err);
  }
  return null;
}

export async function saveAuthSessionToFirestore(session: AuthSession): Promise<void> {
  try {
    await db.collection('authSessions').doc(session.sessionId).set(session, { merge: true });
  } catch (err) {
    console.error('[Server Auth] Error saving authSession to Firestore:', err);
  }
}

/**
 * OTP Rate Limits persistence in Firestore: otpRateLimits/{cleanPhone}
 */
export async function getOtpRateLimitFromFirestore(cleanPhone: string): Promise<OtpRateLimit> {
  try {
    const snap = await db.collection('otpRateLimits').doc(cleanPhone).get();
    if (snap.exists) {
      const data = snap.data();
      return {
        phone: cleanPhone,
        requestTimestamps: Array.isArray(data?.requestTimestamps) ? data.requestTimestamps : [],
        lastRequestAt: Number(data?.lastRequestAt) || 0,
      };
    }
  } catch (err) {
    console.error('[Server Auth] Error reading rateLimit from Firestore:', err);
  }
  return { phone: cleanPhone, requestTimestamps: [], lastRequestAt: 0 };
}

export async function saveOtpRateLimitToFirestore(cleanPhone: string, limit: OtpRateLimit): Promise<void> {
  try {
    await db.collection('otpRateLimits').doc(cleanPhone).set({ ...limit, phone: cleanPhone }, { merge: true });
  } catch (err) {
    console.error('[Server Auth] Error saving rateLimit to Firestore:', err);
  }
}

/**
 * Login Attempts / Lockouts persistence in Firestore: loginAttempts/{cleanPhone}
 */
export async function getLoginAttemptFromFirestore(cleanPhone: string): Promise<LoginAttempt> {
  try {
    const snap = await db.collection('loginAttempts').doc(cleanPhone).get();
    if (snap.exists) {
      const data = snap.data();
      return {
        phone: cleanPhone,
        failedAttempts: Number(data?.failedAttempts) || 0,
        lockedUntil: Number(data?.lockedUntil) || 0,
      };
    }
  } catch (err) {
    console.error('[Server Auth] Error reading loginAttempt from Firestore:', err);
  }
  return { phone: cleanPhone, failedAttempts: 0, lockedUntil: 0 };
}

export async function saveLoginAttemptToFirestore(cleanPhone: string, attempt: LoginAttempt): Promise<void> {
  try {
    await db.collection('loginAttempts').doc(cleanPhone).set({ ...attempt, phone: cleanPhone }, { merge: true });
  } catch (err) {
    console.error('[Server Auth] Error saving loginAttempt to Firestore:', err);
  }
}

export async function clearLoginAttemptInFirestore(cleanPhone: string): Promise<void> {
  try {
    await db.collection('loginAttempts').doc(cleanPhone).delete();
  } catch {}
}

/**
 * User Signed Session Persistence in Firestore: userSessions/{tokenHash}
 */
export async function createSignedUserSession(account: any): Promise<string> {
  const cleanPhone = account.phoneNumber;
  const token = jwt.sign(
    {
      phone: cleanPhone,
      role: account.role || 'merchant',
      merchantId: account.merchantId,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const tokenHash = `sess_${cleanPhone}_${token.slice(-16)}`;
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  await db.collection('userSessions').doc(tokenHash).set({
    tokenHash,
    token,
    phone: cleanPhone,
    createdAt: now,
    expiresAt,
    active: true,
  });

  return token;
}

export async function verifyAndAuthenticateToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
  if (!token) {
    return { valid: false, error: 'No authorization token provided.' };
  }

  let decoded: any = null;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return { valid: false, error: 'Invalid or expired session token.' };
  }

  const cleanPhone = decoded?.phone;
  if (!cleanPhone) {
    return { valid: false, error: 'Malformed session token.' };
  }

  const tokenHash = `sess_${cleanPhone}_${token.slice(-16)}`;
  try {
    const snap = await db.collection('userSessions').doc(tokenHash).get();
    if (!snap.exists) {
      return { valid: false, error: 'Session record not found. Please log in again.' };
    }

    const sessData = snap.data();
    if (!sessData?.active || (sessData?.expiresAt && Date.now() > sessData.expiresAt)) {
      return { valid: false, error: 'Session has expired or was logged out. Please log in again.' };
    }

    const account = await getAccountByPhone(cleanPhone);
    const { passwordHash, pinHash, password, ...cleanAccount } = (account || {}) as any;
    return { valid: true, user: cleanAccount || decoded };
  } catch (err) {
    console.error('[Server Auth] Error verifying session token in Firestore:', err);
    return { valid: false, error: 'Session verification error.' };
  }
}

export async function invalidateUserSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      decoded = jwt.decode(token);
    }
    const cleanPhone = decoded?.phone;
    if (cleanPhone) {
      const tokenHash = `sess_${cleanPhone}_${token.slice(-16)}`;
      await db.collection('userSessions').doc(tokenHash).update({ active: false });
      return true;
    }
  } catch (err) {
    console.error('[Server Auth] Error invalidating user session:', err);
  }
  return false;
}

/**
 * 1. CHECK USER STATUS: Determine if number exists and has a password
 */
export async function handleCheckUser(reqBody: any) {
  const { phone } = reqBody || {};
  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  const account = await getAccountByPhone(cleanPhone);

  const hasPassword = Boolean(
    account && (account.passwordHash || account.pinHash || account.password)
  );

  return {
    success: true,
    phone: cleanPhone,
    exists: Boolean(account),
    hasPassword,
  };
}

/**
 * 2. SEND OTP VIA 2FACTOR.IN (SERVER-SIDE ONLY WITH IP RATE LIMITING)
 */
export async function handleSendOtp(reqBody: any, req?: any) {
  // Enforce IP Rate Limiting
  const ipCheck = await checkIpRateLimit(req, 'send-otp');
  if (!ipCheck.allowed) {
    return { success: false, error: ipCheck.error };
  }

  const { phone, purpose = 'signup' } = reqBody || {};
  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  const now = Date.now();

  const account = await getAccountByPhone(cleanPhone);
  const hasPassword = Boolean(account && (account.passwordHash || account.pinHash));

  if (purpose === 'signup' && hasPassword) {
    return {
      success: false,
      isAlreadyRegistered: true,
      error: 'This mobile number is already registered. Please log in with your password.',
    };
  }

  if (purpose === 'forgot-password' && !account) {
    return {
      success: false,
      error: 'No registered account found for this mobile number. Please sign up first.',
    };
  }

  // Rate Limiting Rules persisted in Firestore
  const rateLimit = await getOtpRateLimitFromFirestore(cleanPhone);

  // 30-second resend cooldown
  if (now - rateLimit.lastRequestAt < 30000) {
    const remainingSecs = Math.ceil((30000 - (now - rateLimit.lastRequestAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSecs} seconds before requesting another OTP.`,
    };
  }

  // Max 3 OTP requests per hour (3600s)
  const oneHourAgo = now - 3600000;
  rateLimit.requestTimestamps = rateLimit.requestTimestamps.filter((t) => t > oneHourAgo);
  if (rateLimit.requestTimestamps.length >= 3) {
    return {
      success: false,
      error: 'Maximum OTP request limit reached (3 per hour). Please try again later.',
    };
  }

  // Construct 2Factor.in API URL
  const templateParam = TWOFACTOR_TEMPLATE_NAME ? `/${TWOFACTOR_TEMPLATE_NAME}` : '';
  const twoFactorUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${cleanPhone}/AUTOGEN${templateParam}`;

  try {
    const apiRes = await fetch(twoFactorUrl, { method: 'GET' });
    const resData: any = await apiRes.json();

    if (resData && resData.Status === 'Success' && resData.Details) {
      const sessionId = resData.Details;

      // Update rate limits in Firestore
      rateLimit.lastRequestAt = now;
      rateLimit.requestTimestamps.push(now);
      await saveOtpRateLimitToFirestore(cleanPhone, rateLimit);

      // Save Auth Session to Firestore
      const newSession: AuthSession = {
        sessionId,
        phone: cleanPhone,
        purpose,
        createdAt: now,
        attempts: 0,
        verified: false,
        verificationToken: null,
        used: false,
      };
      await saveAuthSessionToFirestore(newSession);

      return {
        success: true,
        sessionId,
        message: 'OTP dispatched successfully via SMS.',
      };
    } else {
      console.warn('[2Factor API Response Error]', resData);
      return { success: false, error: 'Could not send OTP, please try again' };
    }
  } catch (err) {
    console.error('[2Factor API Exception]', err);
    return { success: false, error: 'Could not send OTP, please try again' };
  }
}

/**
 * 3. VERIFY OTP VIA 2FACTOR.IN (SERVER-SIDE ONLY)
 */
export async function handleVerifyOtp(reqBody: any) {
  const { phone, sessionId, otp } = reqBody || {};
  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  if (!sessionId || !otp) {
    return { success: false, error: 'Session ID and OTP code are required.' };
  }

  // Fetch session from Firestore
  const session = await getAuthSessionFromFirestore(sessionId);
  if (!session || session.phone !== cleanPhone || session.used) {
    return { success: false, error: 'Invalid or expired OTP session. Please request a new OTP.' };
  }

  const now = Date.now();

  // Expiry Check: OTP expires in 10 minutes (600,000 ms)
  if (now - session.createdAt > 600000) {
    return { success: false, error: 'OTP has expired (valid for 10 minutes). Please request a new OTP.' };
  }

  // Max 3 wrong attempts per session
  if (session.attempts >= 3) {
    return { success: false, error: 'Maximum wrong OTP attempts exceeded (3/3). Please request a new OTP.' };
  }

  // Call 2Factor.in Verification API
  const verifyUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

  try {
    const apiRes = await fetch(verifyUrl, { method: 'GET' });
    const resData: any = await apiRes.json();

    const isMatch = resData && resData.Status === 'Success' && resData.Details === 'OTP Matched';

    if (!isMatch) {
      session.attempts += 1;
      await saveAuthSessionToFirestore(session);
      const remainingAttempts = Math.max(0, 3 - session.attempts);
      return {
        success: false,
        error: `Invalid OTP code. ${remainingAttempts} attempts remaining.`,
      };
    }

    // OTP Verified Successfully! Generate single-use verification token expiring in 10 minutes
    const verificationToken = `vt_${now}_${Math.random().toString(36).substring(2, 12)}`;
    session.verified = true;
    session.verificationToken = verificationToken;
    await saveAuthSessionToFirestore(session);

    return {
      success: true,
      verificationToken,
      message: 'OTP verified successfully.',
    };
  } catch (err) {
    console.error('[2Factor Verify Exception]', err);
    return { success: false, error: 'Could not verify OTP, please try again' };
  }
}

/**
 * 4. REGISTER PASSWORD (FIRST-TIME SIGNUP)
 */
export async function handleRegisterPassword(reqBody: any) {
  const {
    phone,
    password,
    confirmPassword,
    verificationToken,
    fullName = '',
    shopOrVillage = '',
    licenseOrCrop = '',
    shopAddress = '',
    shopNumber = '',
    marketName = '',
    selectedCommodities = ['flowers'],
  } = reqBody || {};

  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  if (!password || password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please re-enter identical passwords.' };
  }

  const now = Date.now();

  // Find verified auth session in Firestore matching verificationToken
  let matchedSession: AuthSession | null = null;
  try {
    const snap = await db
      .collection('authSessions')
      .where('verificationToken', '==', verificationToken)
      .where('phone', '==', cleanPhone)
      .where('purpose', '==', 'signup')
      .where('verified', '==', true)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (!snap.empty) {
      const docData = snap.docs[0].data() as AuthSession;
      if (now - docData.createdAt <= 600000) {
        matchedSession = docData;
      }
    }
  } catch (err) {
    console.error('[Server Auth] Error querying verificationToken in Firestore:', err);
  }

  if (!matchedSession) {
    return {
      success: false,
      error: 'Invalid or expired registration verification. Please verify your phone with OTP first.',
    };
  }

  // Check if account already registered with password
  const existingAcc = await getAccountByPhone(cleanPhone);
  if (existingAcc && (existingAcc.passwordHash || existingAcc.pinHash)) {
    return {
      success: false,
      isAlreadyRegistered: true,
      error: 'This mobile number is already registered. Please log in.',
    };
  }

  // Mark verification token as used immediately
  matchedSession.used = true;
  await saveAuthSessionToFirestore(matchedSession);

  // Hash password using bcrypt on the server
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newAccountRecord = {
    id: existingAcc?.id || `USR-${Date.now()}-${cleanPhone.slice(-4)}`,
    merchantId: existingAcc?.merchantId || `merchant-${cleanPhone}`,
    phoneNumber: cleanPhone,
    fullName: fullName || existingAcc?.fullName || 'Mandi Merchant',
    shopOrVillage: shopOrVillage || existingAcc?.shopOrVillage || 'Market Shop',
    licenseOrCrop: licenseOrCrop || existingAcc?.licenseOrCrop || 'Verified Trader',
    shopAddress: shopAddress || existingAcc?.shopAddress || '',
    shopNumber: shopNumber || existingAcc?.shopNumber || '',
    marketName: marketName || existingAcc?.marketName || 'APMC Market',
    selectedCommodities,
    role: 'merchant',
    passwordHash,
    pinHash: passwordHash,
    createdAt: existingAcc?.createdAt || new Date().toISOString().slice(0, 10),
  };

  // Save permanently to Firestore
  const saved = await saveAccountRecord(cleanPhone, newAccountRecord);
  if (!saved) {
    return { success: false, error: 'Database save failed. Please try again.' };
  }

  // Create signed session token
  const token = await createSignedUserSession(newAccountRecord);

  // Remove password hashes before returning account object
  const { passwordHash: _ph, pinHash: _pnh, password: _plain, ...cleanUserAccount } = newAccountRecord as any;

  return {
    success: true,
    token,
    account: cleanUserAccount,
    message: 'Password created and account registered permanently.',
  };
}

/**
 * 5. RESET PASSWORD (FORGOT PASSWORD)
 */
export async function handleResetPassword(reqBody: any) {
  const { phone, newPassword, confirmNewPassword, verificationToken } = reqBody || {};

  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  if (newPassword !== confirmNewPassword) {
    return { success: false, error: 'New passwords do not match. Please re-enter.' };
  }

  const now = Date.now();

  // Find verified auth session in Firestore matching verificationToken for forgot-password
  let matchedSession: AuthSession | null = null;
  try {
    const snap = await db
      .collection('authSessions')
      .where('verificationToken', '==', verificationToken)
      .where('phone', '==', cleanPhone)
      .where('purpose', '==', 'forgot-password')
      .where('verified', '==', true)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (!snap.empty) {
      const docData = snap.docs[0].data() as AuthSession;
      if (now - docData.createdAt <= 600000) {
        matchedSession = docData;
      }
    }
  } catch (err) {
    console.error('[Server Auth] Error querying reset verificationToken in Firestore:', err);
  }

  if (!matchedSession) {
    return {
      success: false,
      error: 'Invalid or expired password reset verification. Please verify OTP first.',
    };
  }

  const account = await getAccountByPhone(cleanPhone);
  if (!account) {
    return { success: false, error: 'No account record found for this mobile number.' };
  }

  // Mark token as used
  matchedSession.used = true;
  await saveAuthSessionToFirestore(matchedSession);

  // Hash new password using bcrypt on server
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const updatedAccount = {
    ...account,
    passwordHash,
    pinHash: passwordHash,
    passwordResetAt: new Date().toISOString(),
  };
  delete updatedAccount.password;

  // Save updated password hash permanently to Firestore
  await saveAccountRecord(cleanPhone, updatedAccount);

  // Clear lockout counter in Firestore
  await clearLoginAttemptInFirestore(cleanPhone);

  return {
    success: true,
    message: 'Password reset successfully. Your old password has been invalidated. Please log in with your new password.',
  };
}

/**
 * 6. SERVER-SIDE LOGIN VERIFICATION (IP + ACCOUNT LOCKOUT + STRICT PASSCHECK)
 */
export async function handleLogin(reqBody: any, req?: any) {
  // Enforce IP Rate Limiting
  const ipCheck = await checkIpRateLimit(req, 'login');
  if (!ipCheck.allowed) {
    return { success: false, error: ipCheck.error };
  }

  const { phone, password } = reqBody || {};

  const phoneVal = cleanAndValidatePhone(phone);
  if (!phoneVal.isValid) {
    return { success: false, error: phoneVal.error };
  }

  const cleanPhone = phoneVal.cleanPhone;
  if (!password || password.trim().length === 0) {
    return { success: false, error: 'Please enter your password.' };
  }

  const now = Date.now();

  // Fetch 15-Minute Lockout Status from Firestore
  let attempt = await getLoginAttemptFromFirestore(cleanPhone);
  if (attempt.lockedUntil > now) {
    const remainingMins = Math.ceil((attempt.lockedUntil - now) / 60000);
    return {
      success: false,
      isLocked: true,
      error: `Too many failed login attempts. Account is locked for ${remainingMins} minute(s).`,
    };
  }

  // If lockout expired, reset attempts
  if (attempt.lockedUntil <= now && attempt.lockedUntil > 0) {
    attempt.failedAttempts = 0;
    attempt.lockedUntil = 0;
  }

  // Fetch account record from Firestore Admin
  const account = await getAccountByPhone(cleanPhone);
  if (!account) {
    return {
      success: false,
      error: 'You have not registered yet. Please Sign Up first to create your merchant account.',
    };
  }

  const storedHash = account.passwordHash || account.pinHash;
  if (!storedHash) {
    return {
      success: false,
      error: 'No password set for this account. Please complete Sign Up first.',
    };
  }

  // Compare password against stored hash on server
  let isMatch = false;
  try {
    isMatch = await bcrypt.compare(password, storedHash);
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    attempt.failedAttempts += 1;
    if (attempt.failedAttempts >= 5) {
      attempt.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
      await saveLoginAttemptToFirestore(cleanPhone, attempt);
      return {
        success: false,
        isLocked: true,
        error: 'Too many failed login attempts. Account is locked for 15 minutes.',
      };
    } else {
      await saveLoginAttemptToFirestore(cleanPhone, attempt);
      return {
        success: false,
        error: 'Incorrect password.',
      };
    }
  }

  // SUCCESSFUL LOGIN: Clear failed attempts lockout
  await clearLoginAttemptInFirestore(cleanPhone);

  // Generate signed session token
  const token = await createSignedUserSession(account);

  const { passwordHash: _p, pinHash: _ph, password: _plain, ...cleanAccount } = account;

  return {
    success: true,
    token,
    account: cleanAccount,
    message: 'Login successful.',
  };
}

/**
 * 7. LOGOUT: Invalidate active signed session token in Firestore
 */
export async function handleLogout(req: any) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token) {
    await invalidateUserSession(token);
  }
  return { success: true, message: 'Logged out successfully.' };
}

/**
 * 8. GET CURRENT SESSION USER
 */
export async function handleMe(req: any) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const authRes = await verifyAndAuthenticateToken(token);
  if (!authRes.valid) {
    return { success: false, error: authRes.error || 'Unauthorized' };
  }
  return { success: true, user: authRes.user };
}
