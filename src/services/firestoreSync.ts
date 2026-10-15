import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, ensureFirebaseAuth } from './firebase';
import {
  MerchantProfile,
  Farmer,
  SaleLot,
  Shipment,
  PaymentRecord,
  FifteenDaySettlement,
  HelpTicket,
  RegisteredAccount,
  StockItem,
  EmployeeRecord,
  ParchiAuditLog,
  ConnectionRequest,
} from '../types';

export function getMerchantDocId(phone?: string): string | null {
  try {
    const target =
      phone ||
      localStorage.getItem('phoolmitra_current_user_phone') ||
      localStorage.getItem('bharatmandi_active_phone_v1');
    if (target) {
      const clean = target.replace(/\D/g, '').slice(-10);
      if (clean && clean.length === 10) return `merchant-${clean}`;
    }
  } catch {}
  return null;
}

/**
 * Recursively strips keys with undefined values from objects/arrays for Firestore compatibility
 */
export function cleanUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues) as unknown as T;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanUndefinedValues(value) : value;
    }
  }
  return cleaned as T;
}

/**
 * Saves or updates all Mandi data into Firebase Firestore keyed by user's mobile number
 */
export async function syncToFirestore(
  data: {
    profile?: MerchantProfile;
    farmers?: Farmer[];
    lots?: SaleLot[];
    shipments?: Shipment[];
    payments?: PaymentRecord[];
    settlements?: FifteenDaySettlement[];
    stocks?: StockItem[];
    employees?: EmployeeRecord[];
    parchiAuditLogs?: ParchiAuditLog[];
    connectionRequests?: ConnectionRequest[];
    helpTickets?: HelpTicket[];
    registeredAccounts?: RegisteredAccount[];
  },
  overridePhone?: string
): Promise<{ success: boolean; error?: string }> {
  await ensureFirebaseAuth();
  const merchantId = getMerchantDocId(overridePhone);
  if (!merchantId) {
    console.warn('[Firestore Sync] Skipping syncToFirestore: no active merchant phone.');
    return { success: false, error: 'No user phone specified' };
  }
  const cleanPhone = (overridePhone || merchantId.replace('merchant-', '')).replace(/\D/g, '').slice(-10);

  try {
    // 1. Merchant Profile & Document Root
    const currentUid = auth.currentUser?.uid;
    const merchantRef = doc(db, 'merchants', merchantId);
    await setDoc(
      merchantRef,
      cleanUndefinedValues({
        ...(data.profile || {}),
        userPhone: cleanPhone,
        ...(currentUid ? { ownerUid: currentUid } : {}),
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    // 2. Farmers
    if (Array.isArray(data.farmers)) {
      for (const farmer of data.farmers) {
        if (!farmer.id) continue;
        const farmerRef = doc(db, 'merchants', merchantId, 'farmers', String(farmer.id));
        await setDoc(farmerRef, cleanUndefinedValues(farmer), { merge: true });
      }
    }

    // 3. Lots
    if (Array.isArray(data.lots)) {
      for (const lot of data.lots) {
        if (!lot.id) continue;
        const lotRef = doc(db, 'merchants', merchantId, 'lots', String(lot.id));
        await setDoc(lotRef, cleanUndefinedValues(lot), { merge: true });
      }
    }

    // 4. Shipments
    if (Array.isArray(data.shipments)) {
      for (const shipment of data.shipments) {
        if (!shipment.id) continue;
        const shipmentRef = doc(db, 'merchants', merchantId, 'shipments', String(shipment.id));
        await setDoc(shipmentRef, cleanUndefinedValues(shipment), { merge: true });
      }
    }

    // 5. Payments
    if (Array.isArray(data.payments)) {
      for (const payment of data.payments) {
        if (!payment.id) continue;
        const paymentRef = doc(db, 'merchants', merchantId, 'payments', String(payment.id));
        await setDoc(paymentRef, cleanUndefinedValues(payment), { merge: true });
      }
    }

    // 6. Settlements
    if (Array.isArray(data.settlements)) {
      for (const settlement of data.settlements) {
        if (!settlement.id) continue;
        const settlementRef = doc(db, 'merchants', merchantId, 'settlements', String(settlement.id));
        await setDoc(settlementRef, cleanUndefinedValues(settlement), { merge: true });
      }
    }

    // 7. Stocks
    if (Array.isArray(data.stocks)) {
      for (const stock of data.stocks) {
        if (!stock.id) continue;
        const stockRef = doc(db, 'merchants', merchantId, 'stocks', String(stock.id));
        await setDoc(stockRef, cleanUndefinedValues(stock), { merge: true });
      }
    }

    // 8. Employees
    if (Array.isArray(data.employees)) {
      for (const emp of data.employees) {
        if (!emp.id) continue;
        const empRef = doc(db, 'merchants', merchantId, 'employees', String(emp.id));
        await setDoc(empRef, cleanUndefinedValues(emp), { merge: true });
      }
    }

    // 9. Registered Accounts (Keyed by both account.id and clean phone for multi-phone lookup)
    if (Array.isArray(data.registeredAccounts)) {
      for (const account of data.registeredAccounts) {
        if (!account.phoneNumber) continue;
        const phoneKey = account.phoneNumber.replace(/\D/g, '').slice(-10);
        if (phoneKey) {
          const accRef = doc(db, 'registeredAccounts', phoneKey);
          const { password, ...securePayload } = account as any;
          await setDoc(
            accRef,
            cleanUndefinedValues({
              ...securePayload,
              ...(currentUid ? { ownerUid: currentUid } : {}),
            }),
            { merge: true }
          );
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `merchants/${merchantId}`);
    return { success: false, error: err?.message || 'Firestore write failed' };
  }
}

/**
 * Fetches all user records from Cloud Firestore for a specific mobile phone number
 */
export async function fetchFromFirestore(targetPhone?: string): Promise<{
  profile?: MerchantProfile;
  farmers: Farmer[];
  lots: SaleLot[];
  shipments: Shipment[];
  payments: PaymentRecord[];
  settlements: FifteenDaySettlement[];
  stocks: StockItem[];
  employees: EmployeeRecord[];
  parchiAuditLogs: ParchiAuditLog[];
  registeredAccounts: RegisteredAccount[];
  helpTickets: HelpTicket[];
} | null> {
  await ensureFirebaseAuth();
  const merchantId = getMerchantDocId(targetPhone);
  if (!merchantId) {
    console.warn('[Firestore Sync] Skipping fetchFromFirestore: no active merchant phone.');
    return null;
  }
  const cleanPhone = merchantId.replace('merchant-', '');

  try {
    let profile: MerchantProfile | undefined;
    try {
      const merchantDocRef = doc(db, 'merchants', merchantId);
      const merchantSnap = await getDoc(merchantDocRef);
      if (merchantSnap.exists()) {
        profile = merchantSnap.data() as MerchantProfile;
      }
    } catch (e) {
      console.warn(`Error getting merchant profile for ${merchantId}:`, e);
    }

    let userAccount: RegisteredAccount | null = null;
    try {
      if (cleanPhone && cleanPhone.length === 10) {
        const accSnap = await getDoc(doc(db, 'registeredAccounts', cleanPhone));
        if (accSnap.exists()) {
          userAccount = accSnap.data() as RegisteredAccount;
        }
      }
    } catch (e) {
      console.warn(`Error getting registered account for ${cleanPhone}:`, e);
    }

    const safeFetchSubDocs = async (pathSegment: string) => {
      try {
        const snap = await getDocs(collection(db, 'merchants', merchantId, pathSegment));
        return snap.docs.map((d) => d.data());
      } catch (err: any) {
        console.warn(`Firestore read warning for merchants/${merchantId}/${pathSegment}:`, err);
        return [];
      }
    };

    const [
      farmersRes,
      lotsRes,
      shipmentsRes,
      paymentsRes,
      settlementsRes,
      stocksRes,
      employeesRes,
    ] = await Promise.all([
      safeFetchSubDocs('farmers'),
      safeFetchSubDocs('lots'),
      safeFetchSubDocs('shipments'),
      safeFetchSubDocs('payments'),
      safeFetchSubDocs('settlements'),
      safeFetchSubDocs('stocks'),
      safeFetchSubDocs('employees'),
    ]);

    return {
      profile,
      farmers: (farmersRes || []) as Farmer[],
      lots: (lotsRes || []) as SaleLot[],
      shipments: (shipmentsRes || []) as Shipment[],
      payments: (paymentsRes || []) as PaymentRecord[],
      settlements: (settlementsRes || []) as FifteenDaySettlement[],
      stocks: (stocksRes || []) as StockItem[],
      employees: (employeesRes || []) as EmployeeRecord[],
      parchiAuditLogs: [],
      helpTickets: [],
      registeredAccounts: userAccount ? [userAccount] : [],
    };
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, `merchants/${merchantId}`);
    return null;
  }
}

/**
 * Direct lookup of a registered account by phone number across Firestore
 */
export async function fetchUserAccountByPhone(phone: string): Promise<RegisteredAccount | null> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) return null;

  try {
    const accDocRef = doc(db, 'registeredAccounts', cleanPhone);
    const accSnap = await getDoc(accDocRef);
    if (accSnap.exists()) {
      return accSnap.data() as RegisteredAccount;
    }
  } catch (err) {
    console.warn('Error fetching user account by phone from Firestore:', err);
  }
  return null;
}

/**
 * Real-time Listener on Firestore for live multi-device syncing
 */
export function subscribeToFirestore(
  targetPhone: string,
  onUpdate: (data: {
    profile?: MerchantProfile;
    farmers?: Farmer[];
    lots?: SaleLot[];
    shipments?: Shipment[];
    payments?: PaymentRecord[];
    settlements?: FifteenDaySettlement[];
    stocks?: StockItem[];
    employees?: EmployeeRecord[];
  }) => void
) {
  const merchantId = getMerchantDocId(targetPhone);
  if (!merchantId) return () => {};

  const unsubMerchant = onSnapshot(
    doc(db, 'merchants', merchantId),
    (snap) => {
      if (snap.exists() && !snap.metadata.hasPendingWrites) {
        onUpdate({ profile: snap.data() as MerchantProfile });
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, `merchants/${merchantId}`)
  );

  const unsubFarmers = onSnapshot(
    collection(db, 'merchants', merchantId, 'farmers'),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const farmers = snap.docs.map((d) => d.data() as Farmer);
      onUpdate({ farmers });
    },
    (err) => handleFirestoreError(err, OperationType.GET, `merchants/${merchantId}/farmers`)
  );

  const unsubLots = onSnapshot(
    collection(db, 'merchants', merchantId, 'lots'),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const lots = snap.docs.map((d) => d.data() as SaleLot);
      onUpdate({ lots });
    },
    (err) => handleFirestoreError(err, OperationType.GET, `merchants/${merchantId}/lots`)
  );

  const unsubShipments = onSnapshot(
    collection(db, 'merchants', merchantId, 'shipments'),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const shipments = snap.docs.map((d) => d.data() as Shipment);
      onUpdate({ shipments });
    },
    (err) => handleFirestoreError(err, OperationType.GET, `merchants/${merchantId}/shipments`)
  );

  return () => {
    unsubMerchant();
    unsubFarmers();
    unsubLots();
    unsubShipments();
  };
}

export async function deleteFarmerFromFirestore(farmerId: string, phone?: string): Promise<boolean> {
  const merchantId = getMerchantDocId(phone);
  if (!merchantId) return false;
  try {
    const farmerRef = doc(db, 'merchants', merchantId, 'farmers', String(farmerId));
    await deleteDoc(farmerRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `merchants/${merchantId}/farmers/${farmerId}`);
    return false;
  }
}

export async function deleteLotFromFirestore(lotId: string, phone?: string): Promise<boolean> {
  const merchantId = getMerchantDocId(phone);
  if (!merchantId) return false;
  try {
    const lotRef = doc(db, 'merchants', merchantId, 'lots', String(lotId));
    await deleteDoc(lotRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `merchants/${merchantId}/lots/${lotId}`);
    return false;
  }
}

export async function deleteShipmentFromFirestore(shipmentId: string, phone?: string): Promise<boolean> {
  const merchantId = getMerchantDocId(phone);
  if (!merchantId) return false;
  try {
    const shipmentRef = doc(db, 'merchants', merchantId, 'shipments', String(shipmentId));
    await deleteDoc(shipmentRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `merchants/${merchantId}/shipments/${shipmentId}`);
    return false;
  }
}

export async function deletePaymentFromFirestore(paymentId: string, phone?: string): Promise<boolean> {
  const merchantId = getMerchantDocId(phone);
  if (!merchantId) return false;
  try {
    const paymentRef = doc(db, 'merchants', merchantId, 'payments', String(paymentId));
    await deleteDoc(paymentRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `merchants/${merchantId}/payments/${paymentId}`);
    return false;
  }
}

export async function deleteSettlementFromFirestore(settlementId: string, phone?: string): Promise<boolean> {
  const merchantId = getMerchantDocId(phone);
  try {
    const settlementRef = doc(db, 'merchants', merchantId, 'settlements', String(settlementId));
    await deleteDoc(settlementRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `merchants/${merchantId}/settlements/${settlementId}`);
    return false;
  }
}

