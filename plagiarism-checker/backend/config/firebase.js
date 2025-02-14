const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");

const serviceAccount = JSON.parse(fs.readFileSync("./config/serviceAccountKey.json", "utf8"));

const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

exports.auth = getAuth(firebaseApp);