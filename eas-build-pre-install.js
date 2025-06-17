const fs = require('fs');

if (process.env.GOOGLE_SERVICES_JSON) {
  const file = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64');
  fs.writeFileSync('./android/app/google-services.json', file);
  console.log('✅ google-services.json recréé automatiquement.');
} else {
  console.log('⚠️ GOOGLE_SERVICES_JSON non trouvée. Vérifie tes secrets EAS.');
}
