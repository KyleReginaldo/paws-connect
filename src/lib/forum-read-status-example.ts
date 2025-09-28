/**
 * Example of how the forum read status feature works
 * 
 * When fetching forums, each forum now includes:
 * - last_chat: The most recent chat message (with is_viewed property)
 * 
 * The logic for last_chat.is_viewed:
 * - If the user sent the message: true (they've seen their own message)
 * - If someone else sent the message and user is in viewers list: true
 * - If someone else sent the message and user is NOT in viewers list: false
 */

// Example API Response structure:
const exampleForumResponse = {
  "data": [
    {
      "id": 1,
      "forum_name": "Pet Adoption Discussion",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z",
      "created_by": "user-123",
      "private": false,
      "members": [
        // ... member details
      ],
      "member_count": 5,
      "last_chat": {
        "id": 42,
        "message": "Has anyone seen my lost cat?",
        "image_url": null,
        "sent_at": "2025-01-15T14:30:00Z",
        "sender": {
          "id": "user-456",
          "username": "petlover123"
        },
        "is_viewed": false
      },

    },
    {
      "id": 2,
      "forum_name": "Training Tips",
      "created_at": "2025-01-02T11:00:00Z",
      "updated_at": "2025-01-14T16:20:00Z",
      "created_by": "user-789",
      "private": true,
      "members": [
        // ... member details
      ],
      "member_count": 3,
      "last_chat": {
        "id": 38,
        "message": "Thanks for the advice!",
        "image_url": null,
        "sent_at": "2025-01-14T16:20:00Z",
        "sender": {
          "id": "user-789",
          "username": "currentuser"
        },
        "is_viewed": true
      },

    },
    {
      "id": 3,
      "forum_name": "Empty Forum",
      "created_at": "2025-01-03T12:00:00Z",
      "updated_at": "2025-01-03T12:00:00Z",
      "created_by": "user-789",
      "private": false,
      "members": [
        // ... member details
      ],
      "member_count": 2,
      "last_chat": null,

    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
};

// Usage in frontend:
// You can now easily show unread message indicators
/*
function ForumListItem({ forum, currentUserId }) {
  const lastChatUnread = forum.last_chat && !forum.last_chat.is_viewed;
  
  return (
    <div className={`forum-item ${lastChatUnread ? 'has-unread' : ''}`}>
      <h3>{forum.forum_name}</h3>
      {lastChatUnread && (
        <span className="unread-indicator">
          New message from {forum.last_chat?.sender?.username}
        </span>
      )}
      {forum.last_chat && (
        <p className={`last-message ${lastChatUnread ? 'unread' : 'read'}`}>
          {forum.last_chat.message}
          {forum.last_chat.is_viewed ? ' ✓' : ' (unread)'}
        </p>
      )}
    </div>
  );
}
*/

export { exampleForumResponse };
