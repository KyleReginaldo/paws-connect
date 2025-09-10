# Donations API Documentation

This document describes the fixed and improved donations API for the Paws Connect application.

## Overview

The donations API allows users to make donations to fundraising campaigns and provides administrative functionality to manage donations.

## Database Schema

Based on `database.types.ts`, the donations table has the following structure:

```typescript
{
  id: number; // Auto-generated primary key
  amount: number | null; // Donation amount in PHP
  donated_at: string; // ISO timestamp when donation was made
  donor: string | null; // User ID (UUID) of the donor (nullable for anonymous donations)
  fundraising: number | null; // ID of the fundraising campaign
  message: string | null; // Optional message from the donor
}
```

## API Endpoints

### 1. Create Donation - `POST /api/v1/donations`

Creates a new donation for a fundraising campaign.

**Request Body:**

```json
{
  "amount": 1000, // Required: Donation amount (₱1 - ₱1,000,000)
  "fundraising": 123, // Required: Fundraising campaign ID
  "donor": "uuid-string", // Optional: User ID of the donor
  "message": "Good luck!" // Optional: Message from donor (max 500 chars)
}
```

**Response (201 Created):**

```json
{
  "message": "Donation created successfully",
  "donation": {
    "id": 456,
    "amount": 1000,
    "donated_at": "2025-09-11T12:00:00Z",
    "donor": "uuid-string",
    "fundraising": 123,
    "message": "Good luck!"
  },
  "fundraising": {
    "id": 123,
    "title": "Help Save Max",
    "raised_amount": 15000,
    "target_amount": 20000
  }
}
```

**Validation:**

- Validates that the fundraising campaign exists
- Checks that the campaign status is "ONGOING"
- Verifies donor exists if provided
- Automatically updates the fundraising campaign's `raised_amount`

### 2. Get All Donations - `GET /api/v1/donations`

Retrieves a list of all donations with optional filtering.

**Query Parameters:**

- `limit` (optional): Number of results (1-100, default: 10)
- `fundraising` (optional): Filter by fundraising campaign ID

**Response (200 OK):**

```json
{
  "message": "Success",
  "data": [
    {
      "id": 456,
      "amount": 1000,
      "message": "Good luck!",
      "donated_at": "2025-09-11T12:00:00Z",
      "donor": {
        "id": "uuid-string",
        "username": "john_doe",
        "email": "john@example.com"
      },
      "fundraising": {
        "id": 123,
        "title": "Help Save Max",
        "description": "Max needs urgent medical care",
        "target_amount": 20000,
        "raised_amount": 15000
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "count": 1
  }
}
```

### 3. Get User's Donations - `GET /api/v1/donations/user/[userId]`

Retrieves all donations made by a specific user.

**Query Parameters:**

- `limit` (optional): Number of results (1-100, default: 10)

**Response (200 OK):**

```json
{
  "message": "Success",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "donations": [
      {
        "id": 456,
        "amount": 1000,
        "message": "Good luck!",
        "donated_at": "2025-09-11T12:00:00Z",
        "fundraising": {
          "id": 123,
          "title": "Help Save Max",
          "description": "Max needs urgent medical care",
          "target_amount": 20000,
          "raised_amount": 15000,
          "status": "ONGOING",
          "created_by_user": {
            "id": "creator-uuid",
            "username": "shelter_admin",
            "email": "admin@shelter.com"
          }
        }
      }
    ],
    "summary": {
      "total_donations": 5,
      "total_amount": 5000,
      "limit": 10
    }
  }
}
```

### 4. Get Single Donation - `GET /api/v1/donations/[id]`

Retrieves details of a specific donation.

**Response (200 OK):**

```json
{
  "message": "Success",
  "data": {
    "id": 456,
    "amount": 1000,
    "message": "Good luck!",
    "donated_at": "2025-09-11T12:00:00Z",
    "donor": {
      "id": "uuid-string",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "fundraising": {
      "id": 123,
      "title": "Help Save Max",
      "description": "Max needs urgent medical care",
      "target_amount": 20000,
      "raised_amount": 15000
    }
  }
}
```

### 4. Update Donation - `PATCH /api/v1/donations/[id]`

Updates a donation (currently only allows updating the message).

**Request Body:**

```json
{
  "message": "Updated message"
}
```

**Response (200 OK):**

```json
{
  "message": "Donation updated successfully",
  "data": {
    // Updated donation object
  }
}
```

### 5. Delete Donation - `DELETE /api/v1/donations/[id]`

Deletes a donation and automatically updates the fundraising campaign's total.

**Response (200 OK):**

```json
{
  "message": "Donation deleted successfully"
}
```

## Error Responses

All endpoints return standardized error responses:

**400 Bad Request:**

```json
{
  "error": "Invalid request data",
  "issues": [
    {
      "field": "amount",
      "message": "Donation amount must be at least ₱1"
    }
  ]
}
```

**404 Not Found:**

```json
{
  "error": "Fundraising campaign not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "message": "Detailed error message"
}
```

## Key Improvements Made

1. **Proper Type Safety**: Added TypeScript types and interfaces
2. **Input Validation**: Zod schemas for request validation
3. **Database Compliance**: Fixed field mappings to match database schema
4. **Better Error Handling**: Standardized error responses with detailed messages
5. **Fundraising Integration**: Proper validation of campaign status and automatic total updates
6. **Data Relationships**: Proper joins to include donor and fundraising details
7. **Atomic Operations**: Better handling of fundraising total updates
8. **API Standards**: RESTful design with proper HTTP status codes

## Related API Changes

### Fundraising Campaign Details - `GET /api/v1/fundraising/[id]`

The fundraising campaign endpoint has been enhanced to include the list of donations:

**Response (200 OK):**

```json
{
  "message": "Success",
  "data": {
    "id": 123,
    "title": "Help Save Max",
    "description": "Max needs urgent medical care",
    "target_amount": 20000,
    "raised_amount": 15000,
    "status": "ONGOING",
    "created_at": "2025-09-01T10:00:00Z",
    "created_by_user": {
      "username": "shelter_admin",
      "email": "admin@shelter.com"
    },
    "donations": [
      {
        "id": 456,
        "amount": 1000,
        "message": "Good luck!",
        "donated_at": "2025-09-11T12:00:00Z",
        "donor": {
          "id": "uuid-string",
          "username": "john_doe",
          "email": "john@example.com"
        }
      },
      {
        "id": 457,
        "amount": 500,
        "message": null,
        "donated_at": "2025-09-10T14:30:00Z",
        "donor": null
      }
    ]
  }
}
```

## Usage Examples

### Create an anonymous donation

```bash
curl -X POST /api/v1/donations \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "fundraising": 123,
    "message": "Hope this helps!"
  }'
```

### Create a donation with donor

```bash
curl -X POST /api/v1/donations \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "fundraising": 123,
    "donor": "user-uuid-here",
    "message": "From John Doe"
  }'
```

### Get donations for a specific campaign

```bash
curl "/api/v1/donations?fundraising=123&limit=20"
```

### Get all donations by a user

```bash
curl "/api/v1/donations/user/user-uuid-here?limit=50"
```
