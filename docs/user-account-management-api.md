# User Account Management API Documentation

## Overview

These APIs handle accounts created by admins/staff where users need to change their initial password.

## Endpoints

### 1. Check User Creation Status

**GET** `/api/v1/users/created-by/[userId]`

Checks if a user account was created by another user and if they need to change their password.

#### Parameters:

- `userId` (path parameter): The UUID of the user to check

#### Response:

```json
{
  "message": "Success",
  "data": {
    "userId": "user-uuid",
    "username": "john_doe",
    "isCreatedByOther": true,
    "passwordChanged": false,
    "needsPasswordChange": true,
    "createdAt": "2025-09-14T10:30:00Z",
    "createdBy": {
      "id": "admin-uuid",
      "username": "admin_user",
      "role": 1
    }
  }
}
```

#### Use Cases:

- Check if user needs to change password on login
- Display appropriate UI prompts for password change
- Determine account creation source

---

### 2. Change Password for Created Accounts

**POST** `/api/v1/users/change-password`

Changes a user's password and marks `passwordChanged` as true if the account was created by another user.

#### Request Body:

```json
{
  "userId": "user-uuid",
  "newPassword": "newSecurePassword123"
}
```

#### Response:

```json
{
  "message": "Password changed successfully",
  "data": {
    "userId": "user-uuid",
    "wasCreatedByOther": true,
    "passwordChanged": true
  }
}
```

#### Features:

- Updates password in Supabase Auth
- Automatically sets `passwordChanged = true` for accounts created by others
- Validates password strength (minimum 6 characters)
- Provides detailed error messages

## Implementation Flow

### For New Users (Created by Admin/Staff):

1. **Admin creates account** → `created_by` field is set to admin's ID, `passwordChanged` is null/false
2. **User first login** → Check with GET `/created-by/[userId]` endpoint
3. **Force password change** → Use POST `/change-password` endpoint
4. **After password change** → `passwordChanged` becomes true, user can use app normally

### Frontend Integration Example:

```typescript
// Check if user needs to change password
const checkPasswordStatus = async (userId: string) => {
  const response = await fetch(`/api/v1/users/created-by/${userId}`);
  const data = await response.json();

  if (data.data.needsPasswordChange) {
    // Show password change modal
    showPasswordChangeModal();
  }
};

// Change password
const changePassword = async (userId: string, newPassword: string) => {
  const response = await fetch('/api/v1/users/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword }),
  });

  if (response.ok) {
    // Password changed successfully
    redirectToApp();
  }
};
```

## Error Handling

Both endpoints include comprehensive error handling:

- Input validation
- User existence checks
- Database error handling
- Authentication system integration
- Detailed error messages for debugging

## Security Features

- UUID validation for user IDs
- Password strength requirements
- Proper error responses (no sensitive data leakage)
- Integration with Supabase Auth for secure password updates

---

### 3. Submit User ID Verification

**POST** `/api/v1/users/{userId}/id-verification`

Creates or updates the user's verification record and sets their status to `PENDING` for review.

#### Parameters:

- `userId` (path parameter): UUID of the user whose identification is being submitted

#### Request Body:

```json
{
  "id_attachment_url": "https://files.example.com/uploads/philippine-id.png",
  "id_name": "Philippine National ID",
  "address": "123 Maharlika Street, Manila",
  "date_of_birth": "1995-08-14"
}
```

- `id_attachment_url` and `id_name` are required
- `address` and `date_of_birth` are optional, but recommended for faster review
- `status` is managed by the backend and defaults to `PENDING`

#### Response:

```json
{
  "message": "ID verification data saved",
  "data": {
    "id": 42,
    "user": "user-uuid",
    "id_name": "Philippine National ID",
    "id_attachment_url": "https://files.example.com/uploads/philippine-id.png",
    "address": "123 Maharlika Street, Manila",
    "date_of_birth": "1995-08-14",
    "status": "PENDING",
    "created_at": "2025-01-02T10:15:00.000+00:00"
  }
}
```

#### Use Cases:

- Collect identification data during onboarding
- Allow users to resubmit updated documents without creating duplicate records
- Provide admins with richer context when validating an account

```

```
