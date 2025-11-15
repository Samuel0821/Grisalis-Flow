
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.deleteUsers = onCall(async (request) => {
  const { currentAdminId } = request.data;
  
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "La función debe ser llamada por un usuario autenticado."
    );
  }

  // Verify the caller is an admin
  const adminDoc = await getFirestore().collection("userProfiles").doc(request.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== "admin") {
     throw new functions.https.HttpsError(
      "permission-denied",
      "Solo los administradores pueden ejecutar esta acción."
    );
  }

  const auth = getAuth();
  const firestore = getFirestore();
  
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
      // Delete from Firebase Auth (max 1000 at a time)
      await auth.deleteUsers(uidsToDelete);

      // Delete from Firestore userProfiles collection
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
    throw new functions.https.HttpsError(
      "internal",
      "Ocurrió un error al eliminar los usuarios.",
      error
    );
  }
});
