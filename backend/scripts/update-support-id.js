/**
 * Script to update the support account ID in the frontend code
 * 
 * This script should be run after creating the support account
 * to update the frontend code with the new support account ID.
 * 
 * Usage:
 * node backend/scripts/update-support-id.js <support-account-id>
 */

const fs = require('fs');
const path = require('path');

// Path to the message API file
const MESSAGE_API_PATH = path.join(__dirname, '../../frontend/services/api/message.api.js');

// Get support account ID from command line arguments
const supportAccountId = process.argv[2];

if (!supportAccountId) {
  console.error('Error: Support account ID is required');
  console.error('Usage: node backend/scripts/update-support-id.js <support-account-id>');
  process.exit(1);
}

// Validate support account ID format (MongoDB ObjectId)
if (!/^[0-9a-fA-F]{24}$/.test(supportAccountId)) {
  console.error('Error: Invalid support account ID format. Must be a 24-character hex string (MongoDB ObjectId)');
  process.exit(1);
}

// Read the message API file
fs.readFile(MESSAGE_API_PATH, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    process.exit(1);
  }

  // Get the admin ID from the file
  const adminIdMatch = data.match(/const ADMIN_ID = ['"]([0-9a-fA-F]{24})['"];/);
  if (!adminIdMatch) {
    console.error('Error: Could not find ADMIN_ID in the file');
    process.exit(1);
  }
  
  const adminId = adminIdMatch[1];
  
  // Create updated content with support account ID
  const updatedContent = data.replace(
    // Find the SYSTEM_USERS object
    /(const SYSTEM_USERS = \{[\s\S]*?\/\/ Support users.*\n)([\s\S]*?)(\s*\/\/ System notifications)/m,
    (match, prefix, supportSection, suffix) => {
      // Replace admin IDs with support account ID in the support section
      const updatedSupportSection = supportSection.replace(
        new RegExp(`['"]${adminId}['"]`, 'g'),
        `'${supportAccountId}'`
      );
      return prefix + updatedSupportSection + suffix;
    }
  );

  // Write the updated content back to the file
  fs.writeFile(MESSAGE_API_PATH, updatedContent, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing file: ${writeErr}`);
      process.exit(1);
    }
    
    console.log('Support account ID updated successfully in:');
    console.log(MESSAGE_API_PATH);
    console.log(`\nSupport account ID: ${supportAccountId}`);
    
    // Check if the update was successful
    if (updatedContent.includes(supportAccountId)) {
      console.log('Verification: Support account ID found in updated file');
    } else {
      console.error('Warning: Support account ID not found in updated file. Update may have failed.');
    }
  });
}); 