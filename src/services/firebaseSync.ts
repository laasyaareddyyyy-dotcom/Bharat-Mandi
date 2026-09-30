import {
  MerchantProfile,
  Farmer,
  SaleLot,
  Shipment,
  PaymentRecord,
  FifteenDaySettlement,
  HelpTicket,
} from '../types';

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
  try {
    const savedPhone = localStorage.getItem('bharatmandi_active_phone_v1') ?? localStorage.getItem('phoolmitra_current_user_phone');
    if (savedPhone) return `user-${savedPhone}`;
  } catch {}
  return 'laasyaareddyyyy@gmail.com';
}

/**
 * Local Cloud Sync simulation
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
  try {
    localStorage.setItem('bharatmandi_cloud_backup_v1', JSON.stringify(data));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Local storage sync failed' };
  }
}

export async function fetchUserCloudData(): Promise<{
  profile?: MerchantProfile;
  farmers: Farmer[];
  lots: SaleLot[];
  shipments: Shipment[];
  payments: PaymentRecord[];
  settlements: FifteenDaySettlement[];
  helpTickets: HelpTicket[];
} | null> {
  try {
    const saved = localStorage.getItem('bharatmandi_cloud_backup_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        profile: parsed.profile,
        farmers: parsed.farmers || [],
        lots: parsed.lots || [],
        shipments: parsed.shipments || [],
        payments: parsed.payments || [],
        settlements: parsed.settlements || [],
        helpTickets: parsed.helpTickets || [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function syncFarmerToCloud(_farmer: Farmer): Promise<boolean> {
  return true;
}

export async function deleteFarmerFromCloud(_farmerId: string): Promise<boolean> {
  return true;
}

export async function syncLotToCloud(_lot: SaleLot): Promise<boolean> {
  return true;
}

export async function deleteLotFromCloud(_lotId: string): Promise<boolean> {
  return true;
}

export async function syncShipmentToCloud(_shipment: Shipment): Promise<boolean> {
  return true;
}

export async function deleteShipmentFromCloud(_shipmentId: string): Promise<boolean> {
  return true;
}

export async function syncPaymentToCloud(_payment: PaymentRecord): Promise<boolean> {
  return true;
}

export async function deletePaymentFromCloud(_paymentId: string): Promise<boolean> {
  return true;
}

export async function syncSettlementToCloud(_settlement: FifteenDaySettlement): Promise<boolean> {
  return true;
}

export async function syncMerchantProfileToCloud(_profile: MerchantProfile): Promise<boolean> {
  return true;
}

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

    const savedAccounts = localStorage.getItem('bharatmandi_registered_accounts');
    if (savedAccounts) {
      const accounts: any[] = JSON.parse(savedAccounts);
      const exists = accounts.some(
        (acc) => acc.phoneNumber && acc.phoneNumber.replace(/\D/g, '').slice(-10) === cleanPhone
      );
      if (exists) {
        return {
          isDuplicate: true,
          message: `An account with mobile number +91 ${cleanPhone} already exists. Please login instead.`,
        };
      }
    }

    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

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

    const savedFarmers = localStorage.getItem('bharatmandi_farmers');
    if (savedFarmers) {
      const farmers: Farmer[] = JSON.parse(savedFarmers);
      for (const f of farmers) {
        if (params.excludeFarmerId && f.id === params.excludeFarmerId) continue;
        const existingPhone = (f.phone || '').replace(/\D/g, '').slice(-10);
        const existingName = (f.name || '').trim().toLowerCase();
        const existingVillage = (f.village || '').trim().toLowerCase();

        if (cleanPhone && cleanPhone.length === 10 && existingPhone === cleanPhone) {
          return {
            isDuplicate: true,
            message: `A farmer with mobile number +91 ${cleanPhone} already exists (${f.name}).`,
          };
        }

        if (cleanName && cleanVillage && existingName === cleanName && existingVillage === cleanVillage) {
          return {
            isDuplicate: true,
            message: `A farmer with name '${params.name}' in village '${params.village}' is already registered.`,
          };
        }
      }
    }

    return { isDuplicate: false };
  } catch {
    return { isDuplicate: false };
  }
}

export async function checkCloudDuplicateParchi(
  _ownerUid: string,
  _parchiNumber: string
): Promise<boolean> {
  return false;
}

export async function recordCloudUserSession(
  _userPhone: string,
  _sessionId: string
): Promise<boolean> {
  return true;
}

export function listenToSessionConflict(
  _userPhone: string,
  _currentSessionId: string,
  _onConflict: () => void
): () => void {
  return () => {};
}
