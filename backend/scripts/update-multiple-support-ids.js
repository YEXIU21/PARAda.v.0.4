/**
 * Script to update multiple support account IDs in the frontend code
 * 
 * This script should be run after creating the multiple support accounts
 * to update the frontend code with the new support account IDs.
 * 
 * Usage:
 * node backend/scripts/update-multiple-support-ids.js <support-id> <help-id> <customerservice-id>
 * 
 * Example:
 * node backend/scripts/update-multiple-support-ids.js 685fb303bce74865309f692e 685fc123bce74865309f693f 685fc456bce74865309f694a
 */

const fs = require('fs');
const path = require('path');

// Path to the message API file
const MESSAGE_API_PATH = path.join(__dirname, '../../frontend/services/api/message.api.js');

// Get support account IDs from command line arguments
const supportId = process.argv[2];
const helpId = process.argv[3];
const customerserviceId = process.argv[4];

// Check if all IDs are provided
if (!supportId || !helpId || !customerserviceId) {
  console.error('Error: All three support account IDs are required');
  console.error('Usage: node backend/scripts/update-multiple-support-ids.js <support-id> <help-id> <customerservice-id>');
  process.exit(1);
}

// Validate support account ID format (MongoDB ObjectId)
const validateObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
if (!validateObjectId(supportId) || !validateObjectId(helpId) || !validateObjectId(customerserviceId)) {
  console.error('Error: Invalid support account ID format. Must be a 24-character hex string (MongoDB ObjectId)');
  process.exit(1);
}

// Read the message API file
fs.readFile(MESSAGE_API_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file ${MESSAGE_API_PATH}:`, err);
    process.exit(1);
  }

  // Find the SUPPORT_ID constant and replace it
  let updatedContent = data.replace(
    /const SUPPORT_ID = ['"]([0-9a-fA-F]{24})['"];/,
    `// Support account IDs - created by the script
const SUPPORT_ID = '${supportId}';
const HELP_ID = '${helpId}';
const CUSTOMERSERVICE_ID = '${customerserviceId}';`
  );

  // Replace the SYSTEM_USERS object to use separate IDs for each support account
  updatedContent = updatedContent.replace(
    /\/\/ Support users - dedicated support account\s*'support@parada\.com': SUPPORT_ID,\s*'support': SUPPORT_ID,\s*'help@parada\.com': SUPPORT_ID,\s*'customerservice@parada\.com': SUPPORT_ID,/s,
    `// Support users - dedicated support accounts
  'support@parada.com': SUPPORT_ID,
  'support': SUPPORT_ID,
  'help@parada.com': HELP_ID,
  'help': HELP_ID,
  'customerservice@parada.com': CUSTOMERSERVICE_ID,
  'customerservice': CUSTOMERSERVICE_ID,`
  );

  // Write the updated content back to the file
  fs.writeFile(MESSAGE_API_PATH, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file ${MESSAGE_API_PATH}:`, writeErr);
      process.exit(1);
    }

    console.log('Multiple support account IDs updated successfully in:');
    console.log(MESSAGE_API_PATH);
    console.log(`\nSupport account IDs:`);
    console.log(`- support@parada.com: ${supportId}`);
    console.log(`- help@parada.com: ${helpId}`);
    console.log(`- customerservice@parada.com: ${customerserviceId}`);

    // Verify the update was successful
    if (updatedContent.includes(supportId) && 
        updatedContent.includes(helpId) && 
        updatedContent.includes(customerserviceId)) {
      console.log('\nVerification: Support account IDs found in updated file');
    } else {
      console.error('Warning: Some support account IDs not found in updated file. Update may have failed.');
    }
  });
}); 