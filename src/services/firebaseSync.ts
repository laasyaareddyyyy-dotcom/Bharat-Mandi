import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  MerchantProfile,
  Farmer,
  SaleLot,
  Shipment,
  PaymentRecord,
  FifteenDaySettlement,
  HelpTicket,
} from '../types';

/**
 * Recursively removes keys with `undefined` values from objects or arrays
 * to prevent Firestore setDoc errors like "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result as T;
}

export function getActiveOwnerUid(): string {
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  if (auth.currentUser?.email) return auth.currentUser.email;
  try {
    const savedPhone = localStorage.getItem('bharatmandi_active_phone_v1') ?? localStorage.getItem('phoolmitra_current_user_phone');
    if (savedPhone) return `user-${savedPhone}`;
  } catch {}
  return 'laasyaareddyyyy@gmail.com';
}

/**
 * Validates and safely resolves a non-empty document ID.
 */
function resolveDocId(entity: any, fallbackPrefix: string, index?: number): string {
  if (!entity || typeof entity !== 'object') {
    return `${fallbackPrefix}-${Date.now().toString(36)}`;
  }
  const candidate = entity.id || entity.farmerId || entity.merchantId || entity.parchiNumber || entity.chalanNumber || entity.referenceNumber;
  if (candidate && typeof candidate === 'string' && candidate.trim() !== '' && candidate.trim() !== 'undefined') {
    return candidate.trim();
  }
  const suffix = typeof index === 'number' ? String(index + 1).padStart(3, '0') : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  return `${fallbackPrefix}-${suffix}`;
}

/**
 * Uploads/Syncs full current local Mandi state to Cloud Firestore.
 */
export async function syncLocalToFirestore(data: {
  profile: MerchantProfile;
  farmers: Farmer[];
  lots: SaleLot[];
  shipments: Shipment[];
  payments: PaymentRecord[];
  settlements: FifteenDaySettlement[];
  helpTickets?: HelpTicket[];
}): Promise<{ success: boolean; error?: string }> {
  const uid = getActiveOwnerUid();

  try {
    // 1. Sync Merchant Profile
    const profileId = (data.profile?.merchantId && data.profile.merchantId !== 'undefined')
      ? data.profile.merchantId.trim()
      : 'MANDI-HYD-014';
    const profilePath = `merchants/${profileId}`;
    try {
      await setDoc(doc(db, 'merchants', profileId), sanitizeForFirestore({
        ...(data.profile || {}),
        merchantId: profileId,
        ownerUid: uid,
        updatedAt: new Date().toISOString(),
      }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, profilePath);
    }

    // 2. Sync Farmers
    const rawFarmers = Array.isArray(data.farmers) ? data.farmers : [];
    for (let i = 0; i < rawFarmers.length; i++) {
      const farmer = rawFarmers[i];
      if (!farmer || typeof farmer !== 'object') continue;
      const cleanId = resolveDocId(farmer, 'FM', i);
      const path = `farmers/${cleanId}`;
      try {
        await setDoc(doc(db, 'farmers', cleanId), sanitizeForFirestore({
          ...farmer,
          id: cleanId,
          ownerUid: uid,
        }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 3. Sync Lots
    const rawLots = Array.isArray(data.lots) ? data.lots : [];
    for (let i = 0; i < rawLots.length; i++) {
      const lot = rawLots[i];
      if (!lot || typeof lot !== 'object') continue;
      const cleanId = resolveDocId(lot, 'LOT', i);
      const path = `lots/${cleanId}`;
      try {
        await setDoc(doc(db, 'lots', cleanId), sanitizeForFirestore({
          ...lot,
          id: cleanId,
          ownerUid: uid,
        }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 4. Sync Shipments
    const rawShipments = Array.isArray(data.shipments) ? data.shipments : [];
    for (let i = 0; i < rawShipments.length; i++) {
      const shipment = rawShipments[i];
      if (!shipment || typeof shipment !== 'object') continue;
      const cleanId = resolveDocId(shipment, 'SHIP', i);
      const path = `shipments/${cleanId}`;
      try {
        await setDoc(doc(db, 'shipments', cleanId), sanitizeForFirestore({
          ...shipment,
          id: cleanId,
          ownerUid: uid,
        }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 5. Sync Payments
    const rawPayments = Array.isArray(data.payments) ? data.payments : [];
    for (let i = 0; i < rawPayments.length; i++) {
      const payment = rawPayments[i];
      if (!payment || typeof payment !== 'object') continue;
      const cleanId = resolveDocId(payment, 'PAY', i);
      const path = `payments/${cleanId}`;
      try {
        await setDoc(doc(db, 'payments', cleanId), sanitizeForFirestore({
          ...payment,
          id: cleanId,
          ownerUid: uid,
        }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 6. Sync Settlements
    const rawSettlements = Array.isArray(data.settlements) ? data.settlements : [];
    for (let i = 0; i < rawSettlements.length; i++) {
      const settlement = rawSettlements[i];
      if (!settlement || typeof settlement !== 'object') continue;
      const cleanId = resolveDocId(settlement, 'SETTLE', i);
      const path = `settlements/${cleanId}`;
      try {
        await setDoc(doc(db, 'settlements', cleanId), sanitizeForFirestore({
          ...settlement,
          id: cleanId,
          ownerUid: uid,
        }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }

    // 7. Sync Help Tickets if present
    if (Array.isArray(data.helpTickets)) {
      for (let i = 0; i < data.helpTickets.length; i++) {
        const ticket = data.helpTickets[i];
        if (!ticket || typeof ticket !== 'object') continue;
        const cleanId = resolveDocId(ticket, 'TCK', i);
        const path = `helpTickets/${cleanId}`;
        try {
          await setDoc(doc(db, 'helpTickets', cleanId), sanitizeForFirestore({
            ...ticket,
            id: cleanId,
            authorUid: uid,
          }), { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Firestore sync error:', error);
    return { success: false, error: error?.message || 'Unknown Firestore sync error' };
  }
}

/**
 * Loads cloud data from Firestore.
 */
export async function fetchUserCloudData(): Promise<{
  profile?: MerchantProfile;
  farmers: Farmer[];
  lots: SaleLot[];
  shipments: Shipment[];
  payments: PaymentRecord[];
  settlements: FifteenDaySettlement[];
  helpTickets: HelpTicket[];
} | null> {
  const uid = getActiveOwnerUid();

  try {
    // 1. Fetch Profile
    let profile: MerchantProfile | undefined;
    const merchantsPath = 'merchants';
    try {
      const profileDoc = await getDocs(query(collection(db, merchantsPath), where('ownerUid', '==', uid)));
      if (!profileDoc.empty) {
        const raw = profileDoc.docs[0].data();
        const profileId = (raw.merchantId && raw.merchantId !== 'undefined')
          ? raw.merchantId
          : (profileDoc.docs[0].id || 'MANDI-HYD-014');
        profile = {
          ...raw,
          merchantId: profileId,
        } as MerchantProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, merchantsPath);
    }

    // 2. Fetch Farmers (Scoped to active user)
    const farmers: Farmer[] = [];
    const farmersPath = 'farmers';
    try {
      const snap = await getDocs(query(collection(db, farmersPath), where('ownerUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `FM-${farmers.length + 1}`);
        farmers.push({
          ...raw,
          id: validId,
        } as Farmer);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, farmersPath);
    }

    // 3. Fetch Lots (Scoped to active user)
    const lots: SaleLot[] = [];
    const lotsPath = 'lots';
    try {
      const snap = await getDocs(query(collection(db, lotsPath), where('ownerUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `LOT-${lots.length + 1}`);
        lots.push({
          ...raw,
          id: validId,
        } as SaleLot);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, lotsPath);
    }

    // 4. Fetch Shipments (Scoped to active user)
    const shipments: Shipment[] = [];
    const shipmentsPath = 'shipments';
    try {
      const snap = await getDocs(query(collection(db, shipmentsPath), where('ownerUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `SHIP-${shipments.length + 1}`);
        shipments.push({
          ...raw,
          id: validId,
        } as Shipment);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, shipmentsPath);
    }

    // 5. Fetch Payments (Scoped to active user)
    const payments: PaymentRecord[] = [];
    const paymentsPath = 'payments';
    try {
      const snap = await getDocs(query(collection(db, paymentsPath), where('ownerUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `PAY-${payments.length + 1}`);
        payments.push({
          ...raw,
          id: validId,
        } as PaymentRecord);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, paymentsPath);
    }

    // 6. Fetch Settlements (Scoped to active user)
    const settlements: FifteenDaySettlement[] = [];
    const settlementsPath = 'settlements';
    try {
      const snap = await getDocs(query(collection(db, settlementsPath), where('ownerUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `SETTLE-${settlements.length + 1}`);
        settlements.push({
          ...raw,
          id: validId,
        } as FifteenDaySettlement);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, settlementsPath);
    }

    // 7. Fetch Tickets (Scoped to active user)
    const helpTickets: HelpTicket[] = [];
    const ticketsPath = 'helpTickets';
    try {
      const snap = await getDocs(query(collection(db, ticketsPath), where('authorUid', '==', uid)));
      snap.forEach((d) => {
        const raw = d.data();
        const validId = (raw.id && raw.id !== 'undefined')
          ? raw.id
          : (d.id && d.id !== 'undefined' ? d.id : `TCK-${helpTickets.length + 1}`);
        helpTickets.push({
          ...raw,
          id: validId,
        } as HelpTicket);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, ticketsPath);
    }

    return {
      profile,
      farmers,
      lots,
      shipments,
      payments,
      settlements,
      helpTickets,
    };
  } catch (error) {
    console.error('Error fetching cloud data:', error);
    return null;
  }
}

/**
 * Real-time Single Item Cloud Sync Helpers
 */

export async function syncFarmerToCloud(farmer: Farmer): Promise<boolean> {
  if (!farmer || typeof farmer !== 'object') return false;
  const uid = getActiveOwnerUid();
  const farmerId = (farmer.id && farmer.id !== 'undefined')
    ? farmer.id.trim()
    : ((farmer as any).farmerId && (farmer as any).farmerId !== 'undefined' ? String((farmer as any).farmerId).trim() : null);

  if (!farmerId) {
    console.warn('syncFarmerToCloud: skipped due to missing farmer id', farmer);
    return false;
  }

  try {
    await setDoc(doc(db, 'farmers', farmerId), sanitizeForFirestore({
      ...farmer,
      id: farmerId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync farmer to cloud:', err);
    return false;
  }
}

export async function deleteFarmerFromCloud(farmerId: string): Promise<boolean> {
  if (!farmerId || typeof farmerId !== 'string' || farmerId === 'undefined' || farmerId.trim() === '') {
    return false;
  }
  const cleanId = farmerId.trim();
  try {
    await deleteDoc(doc(db, 'farmers', cleanId));
    return true;
  } catch (err) {
    console.warn('Failed to delete farmer from cloud:', err);
    return false;
  }
}

export async function syncLotToCloud(lot: SaleLot): Promise<boolean> {
  if (!lot || typeof lot !== 'object') return false;
  const uid = getActiveOwnerUid();
  const lotId = (lot.id && lot.id !== 'undefined') ? lot.id.trim() : null;
  if (!lotId) {
    console.warn('syncLotToCloud: skipped due to missing lot id', lot);
    return false;
  }
  try {
    await setDoc(doc(db, 'lots', lotId), sanitizeForFirestore({
      ...lot,
      id: lotId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync lot to cloud:', err);
    return false;
  }
}

export async function deleteLotFromCloud(lotId: string): Promise<boolean> {
  if (!lotId || typeof lotId !== 'string' || lotId === 'undefined' || lotId.trim() === '') {
    return false;
  }
  const cleanId = lotId.trim();
  try {
    await deleteDoc(doc(db, 'lots', cleanId));
    return true;
  } catch (err) {
    console.warn('Failed to delete lot from cloud:', err);
    return false;
  }
}

export async function syncShipmentToCloud(shipment: Shipment): Promise<boolean> {
  if (!shipment || typeof shipment !== 'object') return false;
  const uid = getActiveOwnerUid();
  const shipmentId = (shipment.id && shipment.id !== 'undefined') ? shipment.id.trim() : null;
  if (!shipmentId) {
    console.warn('syncShipmentToCloud: skipped due to missing shipment id', shipment);
    return false;
  }
  try {
    await setDoc(doc(db, 'shipments', shipmentId), sanitizeForFirestore({
      ...shipment,
      id: shipmentId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync shipment to cloud:', err);
    return false;
  }
}

export async function deleteShipmentFromCloud(shipmentId: string): Promise<boolean> {
  if (!shipmentId || typeof shipmentId !== 'string' || shipmentId === 'undefined' || shipmentId.trim() === '') {
    return false;
  }
  const cleanId = shipmentId.trim();
  try {
    await deleteDoc(doc(db, 'shipments', cleanId));
    return true;
  } catch (err) {
    console.warn('Failed to delete shipment from cloud:', err);
    return false;
  }
}

export async function syncPaymentToCloud(payment: PaymentRecord): Promise<boolean> {
  if (!payment || typeof payment !== 'object') return false;
  const uid = getActiveOwnerUid();
  const paymentId = (payment.id && payment.id !== 'undefined') ? payment.id.trim() : null;
  if (!paymentId) {
    console.warn('syncPaymentToCloud: skipped due to missing payment id', payment);
    return false;
  }
  try {
    await setDoc(doc(db, 'payments', paymentId), sanitizeForFirestore({
      ...payment,
      id: paymentId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync payment to cloud:', err);
    return false;
  }
}

export async function deletePaymentFromCloud(paymentId: string): Promise<boolean> {
  if (!paymentId || typeof paymentId !== 'string' || paymentId === 'undefined' || paymentId.trim() === '') {
    return false;
  }
  const cleanId = paymentId.trim();
  try {
    await deleteDoc(doc(db, 'payments', cleanId));
    return true;
  } catch (err) {
    console.warn('Failed to delete payment from cloud:', err);
    return false;
  }
}

export async function syncSettlementToCloud(settlement: FifteenDaySettlement): Promise<boolean> {
  if (!settlement || typeof settlement !== 'object') return false;
  const uid = getActiveOwnerUid();
  const settlementId = (settlement.id && settlement.id !== 'undefined') ? settlement.id.trim() : null;
  if (!settlementId) {
    console.warn('syncSettlementToCloud: skipped due to missing settlement id', settlement);
    return false;
  }
  try {
    await setDoc(doc(db, 'settlements', settlementId), sanitizeForFirestore({
      ...settlement,
      id: settlementId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync settlement to cloud:', err);
    return false;
  }
}

export async function syncMerchantProfileToCloud(profile: MerchantProfile): Promise<boolean> {
  if (!profile || typeof profile !== 'object') return false;
  const uid = getActiveOwnerUid();
  const profileId = (profile.merchantId && profile.merchantId !== 'undefined')
    ? profile.merchantId.trim()
    : 'MANDI-HYD-014';
  try {
    await setDoc(doc(db, 'merchants', profileId), sanitizeForFirestore({
      ...profile,
      merchantId: profileId,
      ownerUid: uid,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to auto-sync merchant profile to cloud:', err);
    return false;
  }
}

/**
 * Checks Firestore Database for duplicate signup details (phone number, shop number + market, or credentials).
 */
export async function checkCloudDuplicateRegistration(params: {
  phoneNumber: string;
  shopNumber?: string;
  marketName?: string;
  shopName?: string;
  role?: string;
  excludePhone?: string;
}): Promise<{ isDuplicate: boolean; message?: string }> {
  try {
    const cleanPhone = params.phoneNumber.replace(/\D/g, '').slice(-10);
    const cleanExclude = params.excludePhone ? params.excludePhone.replace(/\D/g, '').slice(-10) : '';

    if (cleanExclude && cleanPhone === cleanExclude) {
      return { isDuplicate: false };
    }

    // 1. Check duplicate phone in accounts collection
    try {
      const phoneQuery = query(collection(db, 'accounts'), where('phoneNumber', '==', cleanPhone));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        const isSelf = phoneSnap.docs.some((d) => d.data().phoneNumber === cleanExclude);
        if (!isSelf) {
          return {
            isDuplicate: true,
            message: `An account with mobile number +91 ${cleanPhone} already exists. Please login instead.`,
          };
        }
      }
    } catch {}

    // 2. Check duplicate phone in merchants collection
    try {
      const merchantPhoneQuery = query(collection(db, 'merchants'), where('phoneNumber', '==', `+91 ${cleanPhone}`));
      const merchantPhoneSnap = await getDocs(merchantPhoneQuery);
      if (!merchantPhoneSnap.empty) {
        return {
          isDuplicate: true,
          message: `A merchant account with mobile number +91 ${cleanPhone} is already registered.`,
        };
      }
    } catch {}

    // 3. Check duplicate shop number within same APMC yard
    if (params.shopNumber && params.shopNumber.trim()) {
      const cleanShopNum = params.shopNumber.trim().toLowerCase();
      try {
        const merchantsSnap = await getDocs(collection(db, 'merchants'));
        for (const docSnap of merchantsSnap.docs) {
          const data = docSnap.data();
          const existingShopNum = String(data.shopNumber || '').trim().toLowerCase();
          const existingMarket = String(data.apmcMarketName || '').trim().toLowerCase();
          const currentMarket = String(params.marketName || '').trim().toLowerCase();

          if (existingShopNum && existingShopNum === cleanShopNum) {
            if (!currentMarket || !existingMarket || currentMarket === existingMarket) {
              return {
                isDuplicate: true,
                message: `Shop Number '${params.shopNumber.trim()}' is already registered in this APMC market yard.`,
              };
            }
          }
        }
      } catch {}
    }

    return { isDuplicate: false };
  } catch (error) {
    console.warn('Cloud duplicate check warning:', error);
    return { isDuplicate: false };
  }
}

/**
 * Checks Firestore Database for duplicate farmer records under active merchant.
 */
export async function checkCloudDuplicateFarmer(params: {
  ownerUid: string;
  phone: string;
  name: string;
  village: string;
  excludeFarmerId?: string;
}): Promise<{ isDuplicate: boolean; message?: string }> {
  try {
    const cleanPhone = params.phone.replace(/\D/g, '').slice(-10);
    const cleanName = params.name.trim().toLowerCase();
    const cleanVillage = params.village.trim().toLowerCase();

    const snap = await getDocs(query(collection(db, 'farmers'), where('ownerUid', '==', params.ownerUid)));
    
    for (const docSnap of snap.docs) {
      if (params.excludeFarmerId && docSnap.id === params.excludeFarmerId) continue;
      const data = docSnap.data();
      const existingPhone = String(data.phone || '').replace(/\D/g, '').slice(-10);
      const existingName = String(data.name || '').trim().toLowerCase();
      const existingVillage = String(data.village || '').trim().toLowerCase();

      if (cleanPhone && cleanPhone.length === 10 && existingPhone === cleanPhone) {
        return {
          isDuplicate: true,
          message: `A farmer with mobile number +91 ${cleanPhone} already exists (${data.name}).`,
        };
      }

      if (cleanName && cleanVillage && existingName === cleanName && existingVillage === cleanVillage) {
        return {
          isDuplicate: true,
          message: `A farmer with name '${params.name}' in village '${params.village}' is already registered.`,
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.warn('Cloud farmer duplicate check warning:', error);
    return { isDuplicate: false };
  }
}

/**
 * Checks Firestore Database for duplicate parchi number under active merchant.
 */
export async function checkCloudDuplicateParchi(
  ownerUid: string,
  parchiNumber: string
): Promise<boolean> {
  try {
    const cleanParchi = parchiNumber.trim();
    if (!cleanParchi) return false;

    const snap = await getDocs(
      query(
        collection(db, 'lots'),
        where('ownerUid', '==', ownerUid),
        where('parchiNumber', '==', cleanParchi)
      )
    );
    return !snap.empty;
  } catch (error) {
    console.warn('Cloud parchi check error:', error);
    return false;
  }
}

/**
 * Multi-device active session enforcement in Firestore:
 * Updates the user's active session token in the database.
 */
export async function recordCloudUserSession(
  userPhone: string,
  sessionId: string
): Promise<boolean> {
  try {
    const cleanPhone = userPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return false;

    await setDoc(
      doc(db, 'userSessions', cleanPhone),
      sanitizeForFirestore({
        phoneNumber: cleanPhone,
        currentSessionId: sessionId,
        lastLoginAt: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-app',
      }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('Failed to record session in cloud:', error);
    return false;
  }
}

/**
 * Listens for concurrent logins on other devices and notifies via callback.
 */
export function listenToSessionConflict(
  userPhone: string,
  currentSessionId: string,
  onConflict: () => void
): Unsubscribe {
  const cleanPhone = userPhone.replace(/\D/g, '').slice(-10);
  if (!cleanPhone) return () => {};

  return onSnapshot(doc(db, 'userSessions', cleanPhone), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.currentSessionId && data.currentSessionId !== currentSessionId) {
        onConflict();
      }
    }
  });
}

