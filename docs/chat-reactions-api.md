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

### POST - Add a reaction to a chat message

```
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

**Response:**

```json
{
  "data": {
    "chat_id": 123,
    "user_id": "uuid-string",
    "reaction": "😀",
    "reactions": {
      "😀": ["user-id-1", "user-id-2"],
      "👍": ["user-id-3"]
    }
  }
}
```

### DELETE - Remove a reaction from a chat message

```
DELETE /api/v1/forum/[id]/chats/[chatId]/reactions?user_id={userId}&reaction={emoji}
```

**Parameters:**

- `id` (path): Forum ID
- `chatId` (path): Chat message ID
- `user_id` (query): User ID who wants to remove their reaction
- `reaction` (query): The emoji reaction to remove

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
// Add a reaction
const response = await fetch('/api/v1/forum/1/chats/123/reactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid',
    reaction: '😀',
  }),
});

// Get all reactions
const reactions = await fetch('/api/v1/forum/1/chats/123/reactions?user_id=user-uuid');

// Remove a reaction
await fetch('/api/v1/forum/1/chats/123/reactions?user_id=user-uuid&reaction=😀', {
  method: 'DELETE',
});
```

## Notes

- Users can only have one reaction per emoji per message
- Reactions are automatically removed if it would be the last user for that emoji
- Private forum access is checked for all operations
- The API validates user existence and forum membership for private forums
