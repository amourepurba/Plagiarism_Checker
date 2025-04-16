const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require(process.env.SERVICE_ACCOUNT_FILE || "./serviceAccountKey.json");

const firebaseApp = initializeApp({
	credential: cert(serviceAccount),
});

exports.auth = getAuth(firebaseApp);
