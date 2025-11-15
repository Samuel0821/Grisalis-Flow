
const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.deleteUsers = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "La función debe ser llamada por un usuario autenticado."
    );
  }

  // Verify the caller is an admin using custom claims.
  if (request.auth.token.admin !== true) {
    throw new functions.httpss.HttpsError(
      "permission-denied",
      "Solo los administradores pueden ejecutar esta acción."
    );
  }
  
  const { currentAdminId } = request.data;
  const auth = admin.auth();
  const firestore = admin.firestore();
  
  const deletedUsers = [];
  const uidsToDelete = [];

  try {
    const listUsersResult = await auth.listUsers(1000);
    
    listUsersResult.users.forEach((userRecord) => {
      // Do not delete the admin who is making the request
      if (userRecord.uid !== currentAdminId) {
        uidsToDelete.push(userRecord.uid);
        deletedUsers.push(userRecord.email);
      }
    });

    if (uidsToDelete.length > 0) {
      await auth.deleteUsers(uidsToDelete);

      const batch = firestore.batch();
      uidsToDelete.forEach(uid => {
        const docRef = firestore.collection("userProfiles").doc(uid);
        batch.delete(docRef);
      });
      await batch.commit();
    }

    return {
      message: `Successfully deleted ${deletedUsers.length} users.`,
      deletedUsers: deletedUsers,
    };

  } catch (error) {
    console.error("Error deleting users:", error);
    throw new functions.httpss.HttpsError(
      "internal",
      "Ocurrió un error al eliminar los usuarios.",
      error
    );
  }
});

exports.setUserRole = functions.https.onCall(async (request) => {
    if (!request.auth || request.auth.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Solo los administradores pueden establecer roles.');
    }

    const { userId, role } = request.data;
    if (!userId || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Se requieren `userId` y `role`.');
    }

    try {
        if (role === 'admin') {
            await admin.auth().setCustomUserClaims(userId, { admin: true });
        } else {
             await admin.auth().setCustomUserClaims(userId, { admin: false });
        }
        
        // Also update the role in Firestore for consistency
        await admin.firestore().collection('userProfiles').doc(userId).update({ role: role });

        return { success: true, message: `Rol de ${userId} actualizado a ${role}.` };
    } catch (error) {
        console.error('Error al establecer el rol de usuario:', error);
        throw new functions.https.HttpsError('internal', 'No se pudo establecer el rol de usuario.');
    }
});
