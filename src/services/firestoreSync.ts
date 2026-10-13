import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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

export function getMerchantDocId(phone?: string): string {
  try {
    const target =
      phone ||
      localStorage.getItem('bharatmandi_active_phone_v1') ||
      localStorage.getItem('phoolmitra_current_user_phone');
    if (target) {
      const clean = target.replace(/\D/g, '').slice(-10);
      if (clean && clean.length === 10) return `merchant-${clean}`;
    }
  } catch {}
  return 'merchant-main';
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
  const merchantId = getMerchantDocId(overridePhone);
  const cleanPhone = (overridePhone || merchantId.replace('merchant-', '')).replace(/\D/g, '').slice(-10);

  try {
    // 1. Merchant Profile & Document Root
    if (data.profile) {
      const merchantRef = doc(db, 'merchants', merchantId);
      await setDoc(
        merchantRef,
        cleanUndefinedValues({
          ...data.profile,
          userPhone: cleanPhone,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }

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
          await setDoc(accRef, cleanUndefinedValues(account), { merge: true });
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
  const merchantId = getMerchantDocId(targetPhone);
  const cleanPhone = (targetPhone || merchantId.replace('merchant-', '')).replace(/\D/g, '').slice(-10);

  try {
    const merchantDocRef = doc(db, 'merchants', merchantId);
    const merchantSnap = await getDoc(merchantDocRef);

    const [
      farmersSnap,
      lotsSnap,
      shipmentsSnap,
      paymentsSnap,
      settlementsSnap,
      stocksSnap,
      employeesSnap,
      accountsSnap,
    ] = await Promise.all([
      getDocs(collection(db, 'merchants', merchantId, 'farmers')),
      getDocs(collection(db, 'merchants', merchantId, 'lots')),
      getDocs(collection(db, 'merchants', merchantId, 'shipments')),
      getDocs(collection(db, 'merchants', merchantId, 'payments')),
      getDocs(collection(db, 'merchants', merchantId, 'settlements')),
      getDocs(collection(db, 'merchants', merchantId, 'stocks')),
      getDocs(collection(db, 'merchants', merchantId, 'employees')),
      getDocs(collection(db, 'registeredAccounts')),
    ]);

    const profile: MerchantProfile | undefined = merchantSnap.exists()
      ? (merchantSnap.data() as MerchantProfile)
      : undefined;

    const farmers: Farmer[] = farmersSnap.docs.map((d) => d.data() as Farmer);
    const lots: SaleLot[] = lotsSnap.docs.map((d) => d.data() as SaleLot);
    const shipments: Shipment[] = shipmentsSnap.docs.map((d) => d.data() as Shipment);
    const payments: PaymentRecord[] = paymentsSnap.docs.map((d) => d.data() as PaymentRecord);
    const settlements: FifteenDaySettlement[] = settlementsSnap.docs.map(
      (d) => d.data() as FifteenDaySettlement
    );
    const stocks: StockItem[] = stocksSnap.docs.map((d) => d.data() as StockItem);
    const employees: EmployeeRecord[] = employeesSnap.docs.map((d) => d.data() as EmployeeRecord);
    const registeredAccounts: RegisteredAccount[] = accountsSnap.docs.map(
      (d) => d.data() as RegisteredAccount
    );

    return {
      profile,
      farmers,
      lots,
      shipments,
      payments,
      settlements,
      stocks,
      employees,
      parchiAuditLogs: [],
      helpTickets: [],
      registeredAccounts,
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

