# Available Forum Members API Documentation

## Endpoint

`GET /api/v1/forum/{forumId}/members/available`

## Purpose

Fetches users with role 3 who can be added to a specific forum. This endpoint automatically filters out:

- Users who are already members of the forum
- The forum creator
- Users with roles other than 3

## Query Parameters

| Parameter | Type   | Required | Default | Description                           |
| --------- | ------ | -------- | ------- | ------------------------------------- |
| `page`    | number | No       | 1       | Page number for pagination            |
| `limit`   | number | No       | 20      | Results per page (max: 100)           |
| `search`  | string | No       | -       | Filter by username (case-insensitive) |

## Usage Examples

### Basic Request

```http
GET /api/v1/forum/123/members/available
```

### With Pagination

```http
GET /api/v1/forum/123/members/available?page=2&limit=50
```

### With Search

```http
GET /api/v1/forum/123/members/available?search=john
```

### Combined Parameters

```http
GET /api/v1/forum/123/members/available?page=1&limit=25&search=admin
```

## Response Format

### Success Response (200)

```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "username": "john_doe",
      "profile_image_link": "https://example.com/profile.jpg"
    },
    {
      "id": "user-uuid-2",
      "username": "jane_smith",
      "profile_image_link": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "forum": {
    "id": 123,
    "created_by": "creator-uuid"
  },
  "filters": {
    "role": 3,
    "search": "john",
    "excluded_count": 5
  }
}
```

### Error Responses

#### Forum Not Found (404)

```json
{
  "error": "Forum not found"
}
```

#### Invalid Forum ID (400)

```json
{
  "error": "Invalid forum id"
}
```

## Integration with Bulk Member Addition

This endpoint is designed to work seamlessly with the bulk member addition feature:

1. **Fetch Available Users**: Use this endpoint to get users that can be added
2. **Select Users**: Present the filtered list to the user for selection
3. **Bulk Add**: Use the selected user IDs with the bulk member addition endpoint

### Example Workflow

```javascript
// 1. Fetch available users
const response = await fetch('/api/v1/forum/123/members/available?limit=50');
const { data: availableUsers } = await response.json();

// 2. Let user select from available users (UI implementation)
const selectedUserIds = getUserSelection(availableUsers);

// 3. Bulk add selected users
await fetch('/api/v1/forum/123/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    members: selectedUserIds,
    added_by: 'creator-uuid',
  }),
});
```

## Benefits

- **Prevents Duplicates**: Only shows users who can actually be added
- **Role-Specific**: Filters to only show users with role 3
- **Efficient**: Uses database-level filtering for optimal performance
- **User-Friendly**: Includes search and pagination for better UX
- **Detailed Info**: Provides metadata about filtering and forum context

## Caching

Response includes cache headers for 60 seconds to improve performance while ensuring data freshness.
