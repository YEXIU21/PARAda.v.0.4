# Backend Scripts

This directory contains utility scripts for the PARAda backend.

## Available Scripts

### create-support-account.js

Creates a dedicated support account in the database for handling customer inquiries.

#### Usage

```bash
# Make sure you're in the project root directory
cd /path/to/PARAda

# Run the script
node backend/scripts/create-support-account.js
```

#### Configuration

The script uses the following environment variables:

- `MONGODB_URI`: MongoDB connection string (required)
- `SUPPORT_PASSWORD`: Password for the support account (optional, defaults to 'Support@123!')

#### After Running

After running the script, you'll get the ID of the created support account. You should use the `update-support-id.js` script to update the frontend code with this ID.

### update-support-id.js

Updates the support account ID in the frontend code after creating a support account.

#### Usage

```bash
# Make sure you're in the project root directory
cd /path/to/PARAda

# Run the script with the support account ID
node backend/scripts/update-support-id.js <support-account-id>
```

For example:

```bash
node backend/scripts/update-support-id.js 60f1a5b3e5eadd76e619f887
```

#### What It Does

This script:

1. Reads the `frontend/services/api/message.api.js` file
2. Finds the support user entries in the `SYSTEM_USERS` object
3. Updates their IDs from the admin ID to the support account ID
4. Writes the changes back to the file

#### Security Notes

- Change the default password immediately after creation
- Store the password securely
- Consider setting up 2FA for the support account 