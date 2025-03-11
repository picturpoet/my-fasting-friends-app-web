const fs = require('fs');
const path = require('path');

// Generate a new app version based on timestamp
const newVersion = Date.now().toString();

// Update App.js
const appFilePath = path.join(__dirname, 'src', 'App.js');
let appContent = fs.readFileSync(appFilePath, 'utf8');

appContent = appContent.replace(
  /const appVersion = "(.*?)";/,
  `const appVersion = "${newVersion}";`
);

fs.writeFileSync(appFilePath, appContent);
console.log(`App.js version updated to ${newVersion}`);

// Update index.js
const indexFilePath = path.join(__dirname, 'src', 'index.js');
let indexContent = fs.readFileSync(indexFilePath, 'utf8');

indexContent = indexContent.replace(
  /const appVersion = "(.*?)";/,
  `const appVersion = "${newVersion}";`
);

fs.writeFileSync(indexFilePath, indexContent);
console.log(`index.js version updated to ${newVersion}`);

console.log(`App version updated successfully to ${newVersion}`);