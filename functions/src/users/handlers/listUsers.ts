import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * List all users (admin only)
 * Returns all users from Firestore for syncing to mobile app
 *
 * GET /listUsers
 *
 * Response:
 * {
 *   success: true,
 *   users: [
 *     {
 *       id: string,
 *       displayName: string,
 *       role: string,
 *       authStatus: string,
 *       authorizedDevices: string[],
 *       isActive: boolean,
 *       invitationId?: string,
 *       lastAccessAt?: string,
 *       createdAt: string,
 *       updatedAt: string
 *     }
 *   ]
 * }
 */
export const listUsers = onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const db = getFirestore();

    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar usuarios',
    });
  }
});
