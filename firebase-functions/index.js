const functions = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.updateUser = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check: Ensure the user is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "La función debe ser llamada por un usuario autenticado."
        );
    }

    // 2. Admin Role Check: Verify the calling user is an admin.
    const callerUid = context.auth.uid;
    const callerUserRecord = await admin.auth().getUser(callerUid);
    const callerClaims = callerUserRecord.customClaims;

    if (callerClaims.role !== 'admin') {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Se requiere rol de administrador para realizar esta acción."
        );
    }

    const { uid, email, displayName, role } = data;

    // 3. Input Validation: Ensure required data is present.
    if (!uid || !email || !displayName || !role) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Faltan datos requeridos (uid, email, displayName, role)."
        );
    }

    try {
        // 4. Update Firebase Authentication
        await admin.auth().updateUser(uid, {
            email: email,
            displayName: displayName,
        });

        // 5. Update custom claims (role)
        await admin.auth().setCustomUserClaims(uid, { role: role });

        // 6. Update Firestore userProfile document
        const userProfileRef = admin.firestore().collection("userProfiles").doc(uid);
        await userProfileRef.update({
            email: email,
            displayName: displayName,
            role: role
        });

        return { message: `¡Éxito! El usuario ${displayName} ha sido actualizado.` };

    } catch (error) {
        console.error("Error al actualizar el usuario:", error);
        // Provide a more specific error message if possible
        if (error.code === 'auth/email-already-exists') {
             throw new functions.https.HttpsError(
                "already-exists",
                "El nuevo correo electrónico ya está en uso por otra cuenta."
            );
        }
        throw new functions.https.HttpsError(
            "internal",
            "Ocurrió un error interno al actualizar el usuario.",
            error
        );
    }
});