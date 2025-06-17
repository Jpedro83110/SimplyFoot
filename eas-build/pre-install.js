const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');

if (process.env.GOOGLE_SERVICES_JSON) {
  const file = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64');
  fs.writeFileSync(jsonPath, file);
  console.log('✅ Fichier google-services.json recréé dans android/app.');
} else {
  console.log('❌ GOOGLE_SERVICES_JSON est manquant dans les variables d’environnement.');
}
