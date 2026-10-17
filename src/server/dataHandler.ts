import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import firebaseConfig from '../../firebase-applet-config.json';

const adminApp = !getApps().length
  ? initializeApp({
      projectId: firebaseConfig.projectId,
    })
  : getApp();

const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || '(default)');

function cleanUndefinedValues<T>(obj: T): T {
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
 * Sync Merchant Data to Firestore Admin (merchants/merchant-{phone})
 */
export async function handleSyncData(userPhone: string, data: any) {
  if (!userPhone || userPhone.length !== 10) {
    return { success: false, error: 'Invalid user phone for data sync.' };
  }

  const merchantId = `merchant-${userPhone}`;

  try {
    const merchantRef = db.collection('merchants').doc(merchantId);

    // 1. Merchant Profile & Document Root
    if (data.profile) {
      await merchantRef.set(
        cleanUndefinedValues({
          ...data.profile,
          userPhone,
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }

    // 2. Farmers
    if (Array.isArray(data.farmers)) {
      for (const farmer of data.farmers) {
        if (!farmer.id) continue;
        await merchantRef.collection('farmers').doc(String(farmer.id)).set(cleanUndefinedValues(farmer), { merge: true });
      }
    }

    // 3. Lots
    if (Array.isArray(data.lots)) {
      for (const lot of data.lots) {
        if (!lot.id) continue;
        await merchantRef.collection('lots').doc(String(lot.id)).set(cleanUndefinedValues(lot), { merge: true });
      }
    }

    // 4. Shipments
    if (Array.isArray(data.shipments)) {
      for (const shipment of data.shipments) {
        if (!shipment.id) continue;
        await merchantRef.collection('shipments').doc(String(shipment.id)).set(cleanUndefinedValues(shipment), { merge: true });
      }
    }

    // 5. Payments
    if (Array.isArray(data.payments)) {
      for (const payment of data.payments) {
        if (!payment.id) continue;
        await merchantRef.collection('payments').doc(String(payment.id)).set(cleanUndefinedValues(payment), { merge: true });
      }
    }

    // 6. Settlements
    if (Array.isArray(data.settlements)) {
      for (const settlement of data.settlements) {
        if (!settlement.id) continue;
        await merchantRef.collection('settlements').doc(String(settlement.id)).set(cleanUndefinedValues(settlement), { merge: true });
      }
    }

    // 7. Stocks
    if (Array.isArray(data.stocks)) {
      for (const stock of data.stocks) {
        if (!stock.id) continue;
        await merchantRef.collection('stocks').doc(String(stock.id)).set(cleanUndefinedValues(stock), { merge: true });
      }
    }

    // 8. Employees
    if (Array.isArray(data.employees)) {
      for (const emp of data.employees) {
        if (!emp.id) continue;
        await merchantRef.collection('employees').doc(String(emp.id)).set(cleanUndefinedValues(emp), { merge: true });
      }
    }

    return { success: true, message: 'Data synced successfully to server database.' };
  } catch (err: any) {
    console.error('[Server Data Handler] Sync error:', err);
    return { success: false, error: err?.message || 'Server error syncing data.' };
  }
}

/**
 * Fetch Merchant Data from Firestore Admin (merchants/merchant-{phone})
 */
export async function handleFetchData(userPhone: string) {
  if (!userPhone || userPhone.length !== 10) {
    return { success: false, error: 'Invalid user phone for data fetch.' };
  }

  const merchantId = `merchant-${userPhone}`;

  try {
    const merchantRef = db.collection('merchants').doc(merchantId);
    const merchantSnap = await merchantRef.get();
    const profile = merchantSnap.exists ? merchantSnap.data() : undefined;

    const safeFetchSubDocs = async (collectionName: string) => {
      try {
        const snap = await merchantRef.collection(collectionName).get();
        return snap.docs.map((d) => d.data());
      } catch (err) {
        console.warn(`[Server Data Handler] Fetch subdoc error for ${collectionName}:`, err);
        return [];
      }
    };

    const [farmers, lots, shipments, payments, settlements, stocks, employees] = await Promise.all([
      safeFetchSubDocs('farmers'),
      safeFetchSubDocs('lots'),
      safeFetchSubDocs('shipments'),
      safeFetchSubDocs('payments'),
      safeFetchSubDocs('settlements'),
      safeFetchSubDocs('stocks'),
      safeFetchSubDocs('employees'),
    ]);

    return {
      success: true,
      data: {
        profile,
        farmers,
        lots,
        shipments,
        payments,
        settlements,
        stocks,
        employees,
      },
    };
  } catch (err: any) {
    console.error('[Server Data Handler] Fetch error:', err);
    return { success: false, error: err?.message || 'Server error fetching data.' };
  }
}

/**
 * Delete Item from Merchant Subcollection
 */
export async function handleDeleteData(userPhone: string, itemType: string, itemId: string) {
  if (!userPhone || !itemType || !itemId) {
    return { success: false, error: 'Missing parameters for data deletion.' };
  }

  const merchantId = `merchant-${userPhone}`;
  const validCollections = ['farmers', 'lots', 'shipments', 'payments', 'settlements', 'stocks', 'employees'];

  if (!validCollections.includes(itemType)) {
    return { success: false, error: 'Invalid collection type.' };
  }

  try {
    await db.collection('merchants').doc(merchantId).collection(itemType).doc(String(itemId)).delete();
    return { success: true, message: `Item ${itemId} deleted from ${itemType}.` };
  } catch (err: any) {
    console.error('[Server Data Handler] Delete error:', err);
    return { success: false, error: err?.message || 'Server error deleting data item.' };
  }
}
