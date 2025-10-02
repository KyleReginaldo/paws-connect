# Chat Reactions API Documentation

This API allows users to add, remove, and view reactions (emojis) on forum chat messages.

## Base URL

```
/api/v1/forum/[id]/chats/[chatId]/reactions
```

## Endpoints

### GET - Get all reactions for a chat message

```
GET /api/v1/forum/[id]/chats/[chatId]/reactions?user_id={userId}
```

**Parameters:**

- `id` (path): Forum ID
- `chatId` (path): Chat message ID
- `user_id` (query): Current user ID for permission checking

**Response:**

```json
{
  "data": {
    "😀": ["user-id-1", "user-id-2"],
    "👍": ["user-id-3"]
  },
  "summary": {
    "😀": {
      "count": 2,
      "users": ["user-id-1", "user-id-2"]
    },
    "👍": {
      "count": 1,
      "users": ["user-id-3"]
    }
  }
}
```

### POST - Add/Remove a reaction to a chat message

```http
POST /api/v1/forum/[id]/chats/[chatId]/reactions
Content-Type: application/json
```

**Parameters:**

- `id` (path): Forum ID
- `chatId` (path): Chat message ID

**Request Body:**

```json
{
  "user_id": "uuid-string",
  "reaction": "😀"
}
```

**Response (when adding):**

```json
{
  "data": {
    "chat_id": 123,
    "user_id": "uuid-string",
    "reaction": "😀",
    "action": "added",
    "reactions": {
      "😀": ["user-id-1", "user-id-2"],
      "👍": ["user-id-3"]
    }
  }
}
```

**Response (when removing - toggle):**

```json
{
  "data": {
    "chat_id": 123,
    "user_id": "uuid-string",
    "reaction": "😀",
    "action": "removed",
    "reactions": {
      "👍": ["user-id-3"]
    }
  }
}
```

### DELETE - Remove a user's reaction from a chat message

```
DELETE /api/v1/forum/[id]/chats/[chatId]/reactions?user_id={userId}
```

**Parameters:**

- `id` (path): Forum ID
- `chatId` (path): Chat message ID
- `user_id` (query): User ID who wants to remove their reaction

**Response:**

```json
{
  "message": "Reaction removed successfully",
  "data": {
    "chat_id": 123,
    "user_id": "uuid-string",
    "reaction": "😀",
    "reactions": {
      "👍": ["user-id-3"]
    }
  }
}
```

## Error Responses

### 400 Bad Request

- Invalid forum ID or chat ID
- Invalid JSON in request body
- Validation errors

### 401 Unauthorized

- Authentication required for private forums

### 403 Forbidden

- Access denied to private forum

### 404 Not Found

- Forum not found
- Chat message not found
- Reaction not found (for DELETE)

### 409 Conflict

- User has already reacted with this emoji

### 500 Internal Server Error

- Database errors
- Server errors

## Data Structure

Reactions are stored as a JSON array in the `forum_chats.reactions` field:

```json
[
  {
    "emoji": "😀",
    "users": ["user-id-1", "user-id-2"]
  },
  {
    "emoji": "👍",
    "users": ["user-id-3", "user-id-4"]
  },
  {
    "emoji": "❤️",
    "users": ["user-id-5"]
  }
]
```

The API returns reactions in a more convenient object format for frontend consumption:

```json
{
  "😀": ["user-id-1", "user-id-2"],
  "👍": ["user-id-3", "user-id-4"],
  "❤️": ["user-id-5"]
}
```

## Usage Examples

### JavaScript/TypeScript

```javascript
// Add a reaction (or remove if clicking same emoji - toggle behavior)
const response = await fetch('/api/v1/forum/1/chats/123/reactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid',
    reaction: '😀',
  }),
});

const result = await response.json();
console.log(result.data.action); // 'added' or 'removed'

// Get all reactions
const reactions = await fetch('/api/v1/forum/1/chats/123/reactions?user_id=user-uuid');

// Remove user's reaction (removes any emoji the user reacted with)
await fetch('/api/v1/forum/1/chats/123/reactions?user_id=user-uuid', {
  method: 'DELETE',
});
```

## Notes

- **Toggle behavior**: Clicking the same emoji twice will add then remove the reaction
- **One reaction per user**: Users can only have one reaction per message. Sending a different emoji replaces the old one.
- **Fast performance**: Optimized with minimal database queries and parallel operations for speed.
- Reactions are automatically removed if it would be the last user for that emoji
- Private forum access is checked for all operations
- The API validates user existence and forum membership for private forums
- DELETE removes the user's reaction regardless of which emoji they used
- POST response includes an `action` field indicating whether the reaction was "added" or "removed"
