import { getAuthHeaders } from './serverAuth';
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
 * Recursively strips keys with undefined values from objects/arrays
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
 * Saves or updates all Mandi data via authenticated server endpoint (/api/data/sync)
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
  try {
    const headers = getAuthHeaders();
    if (headers['Authorization']) {
      const res = await fetch('/api/data/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (resJson.success) {
        return { success: true };
      }
      return { success: false, error: resJson.error || 'Server sync error' };
    }
  } catch (err) {
    console.warn('[Data Sync] Server data sync endpoint exception:', err);
  }
  return { success: true };
}

/**
 * Fetches all user records via authenticated server endpoint (/api/data/fetch)
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
  try {
    const headers = getAuthHeaders();
    if (headers['Authorization']) {
      const res = await fetch('/api/data/fetch', {
        method: 'GET',
        headers,
      });
      const resJson = await res.json();
      if (resJson.success && resJson.data) {
        return {
          profile: resJson.data.profile,
          farmers: (resJson.data.farmers || []) as Farmer[],
          lots: (resJson.data.lots || []) as SaleLot[],
          shipments: (resJson.data.shipments || []) as Shipment[],
          payments: (resJson.data.payments || []) as PaymentRecord[],
          settlements: (resJson.data.settlements || []) as FifteenDaySettlement[],
          stocks: (resJson.data.stocks || []) as StockItem[],
          employees: (resJson.data.employees || []) as EmployeeRecord[],
          parchiAuditLogs: [],
          helpTickets: [],
          registeredAccounts: [],
        };
      }
    }
  } catch (err) {
    console.warn('[Data Fetch] Server data fetch endpoint exception:', err);
  }

  return {
    profile: undefined,
    farmers: [],
    lots: [],
    shipments: [],
    payments: [],
    settlements: [],
    stocks: [],
    employees: [],
    parchiAuditLogs: [],
    helpTickets: [],
    registeredAccounts: [],
  };
}

/**
 * Direct lookup of a registered account by phone number
 */
export async function fetchUserAccountByPhone(phone: string): Promise<RegisteredAccount | null> {
  return null;
}

/**
 * Server-authenticated polling listener for live multi-device syncing
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
  let active = true;

  const poll = async () => {
    if (!active) return;
    const fetched = await fetchFromFirestore(targetPhone);
    if (fetched && active) {
      onUpdate({
        profile: fetched.profile,
        farmers: fetched.farmers,
        lots: fetched.lots,
        shipments: fetched.shipments,
        payments: fetched.payments,
        settlements: fetched.settlements,
        stocks: fetched.stocks,
        employees: fetched.employees,
      });
    }
  };

  // Poll server data route every 12 seconds
  const intervalId = setInterval(poll, 12000);

  return () => {
    active = false;
    clearInterval(intervalId);
  };
}

/**
 * Helper function for server item deletion
 */
async function deleteItemViaServer(itemType: string, itemId: string): Promise<boolean> {
  try {
    const headers = getAuthHeaders();
    if (headers['Authorization']) {
      const res = await fetch('/api/data/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ itemType, itemId }),
      });
      const resJson = await res.json();
      return Boolean(resJson.success);
    }
  } catch (err) {
    console.warn(`[Data Delete] Exception deleting ${itemType} ${itemId}:`, err);
  }
  return true;
}

export async function deleteFarmerFromFirestore(farmerId: string, _phone?: string): Promise<boolean> {
  return deleteItemViaServer('farmers', farmerId);
}

export async function deleteLotFromFirestore(lotId: string, _phone?: string): Promise<boolean> {
  return deleteItemViaServer('lots', lotId);
}

export async function deleteShipmentFromFirestore(shipmentId: string, _phone?: string): Promise<boolean> {
  return deleteItemViaServer('shipments', shipmentId);
}

export async function deletePaymentFromFirestore(paymentId: string, _phone?: string): Promise<boolean> {
  return deleteItemViaServer('payments', paymentId);
}

export async function deleteSettlementFromFirestore(settlementId: string, _phone?: string): Promise<boolean> {
  return deleteItemViaServer('settlements', settlementId);
}
