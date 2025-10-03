# Events API Documentation

## Overview

The Events API provides endpoints for managing community posts within the Paws Connect platform. Users can create, view, update, and delete pet-related posts with support for images and AI-generated community engagement questions. These posts are social media-style content about pet situations, shelter needs, adoption stories, and pet-related experiences.

## Endpoints

### 1. Get All Posts

**GET** `/api/v1/events`

Retrieves a list of community posts with pagination and search functionality.

#### Query Parameters:

- `limit` (optional): Number of posts to return (default: 20)
- `offset` (optional): Number of posts to skip for pagination (default: 0)
- `search` (optional): Search term to filter posts by title or description#### Response:

```json
  "message": "Events fetched successfully",
  "data": [
    {
      "id": 1,
      "title": "I'm hungry and the dogs in the shelter are hungry too",
      "description": "Just visited the local animal shelter and saw so many hungry pups. They're running low on food donations and could really use our help!",
      "images": [
        "https://example.com/hungry-dogs.jpg",
        "https://example.com/shelter-food.jpg"
      ],
      "suggestions": [
        "How can we help?",
        "Which shelter is this?",
        "Need food donations?"
      ],
```

---

### 2. Create New Post

**POST** `/api/v1/events`

Creates a new community post about pets, shelters, or animal-related experiences.

#### Request Body:

```json
{
  "title": "I'm hungry and the dogs in the shelter are hungry too",
  "description": "Just visited the local animal shelter and saw so many hungry pups. They're running low on food donations and could really use our help!",
  "images": ["https://example.com/hungry-dogs.jpg", "https://example.com/shelter-food.jpg"],
  "created_by": "user-uuid"
}
```

#### Required Fields:

- `title`: Post title or main message (string)
- `images`: Array of image URLs (string[])

#### Optional Fields:

- `description`: Additional post content or details (string|null)
- `created_by`: UUID of the user creating the post (string|null)

#### AI-Generated Features:

- `suggestions`: Automatically generated using OpenAI based on post content
- Only pet/animal-related community engagement questions are generated
- 3-5 short, supportive questions to encourage community interaction
- Questions are caring and under 6 words each

#### Response:

```json
{
  "message": "Event created successfully with AI-generated suggestions",
  "data": {
    "id": 1,
    "title": "I'm hungry and the dogs in the shelter are hungry too",
    "description": "Just visited the local animal shelter and saw so many hungry pups. They're running low on food donations and could really use our help!",
    "images": ["https://example.com/hungry-dogs.jpg", "https://example.com/shelter-food.jpg"],
    "suggestions": ["How can we help?", "Which shelter is this?", "Need food donations?"],
    "created_at": "2025-10-01T10:00:00.000Z",
    "created_by": "user-uuid"
  },
  "ai_suggestions_generated": true
}
```

---

### 3. Get Single Event

**GET** `/api/v1/events/{eventId}`

Retrieves details for a specific event.

#### Parameters:

- `eventId` (path parameter): Numeric ID of the event

#### Response:

```json
{
  "message": "Event fetched successfully",
  "data": {
    "id": 1,
    "title": "Community Pet Adoption Day",
    "description": "Join us for a special adoption event featuring rescued pets looking for their forever homes.",
    "images": ["https://example.com/adoption-event.jpg", "https://example.com/pets-available.jpg"],
    "suggestions": ["Bring pet supplies to donate", "Consider fostering if you can't adopt"],
    "created_at": "2025-10-01T10:00:00.000Z",
    "created_by": "user-uuid",
    "users": {
      "id": "user-uuid",
      "username": "event_coordinator",
      "profile_image_link": "https://example.com/profile.jpg"
    }
  }
}
```

---

### 4. Update Event

**PUT** `/api/v1/events/{eventId}`

Updates an existing event. Only provided fields will be updated.

#### Parameters:

- `eventId` (path parameter): Numeric ID of the event to update

#### Request Body:

```json
{
  "title": "Updated Event Title",
  "description": "Updated event description",
  "images": ["https://example.com/new-image.jpg"]
}
```

#### AI Suggestion Regeneration:

- Suggestions are automatically regenerated when `title` or `description` is updated
- Uses OpenAI to generate new community engagement questions
- Manual suggestion updates are not supported - all suggestions are AI-generated
- Questions encourage community support and interaction

#### Response:

```json
{
  "message": "Event updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Event Title",
    "description": "Updated event description",
    "images": ["https://example.com/new-image.jpg"],
    "suggestions": ["What time should I arrive?", "Can I bring my pet?", "How long does it last?"],
    "created_at": "2025-10-01T10:00:00.000Z",
    "created_by": "user-uuid",
    "users": {
      "id": "user-uuid",
      "username": "event_coordinator",
      "profile_image_link": "https://example.com/profile.jpg"
    }
  },
  "ai_suggestions_regenerated": true
}
```

---

### 5. Delete Post

**DELETE** `/api/v1/events/{eventId}`

Deletes an existing community post.

#### Parameters:

- `eventId` (path parameter): Numeric ID of the post to delete

#### Response:

```json
{
  "message": "Event deleted successfully",
  "data": {
    "id": 1,
    "title": "Community Pet Adoption Day"
  }
}
```

---

### 6. Regenerate Post Suggestions

**POST** `/api/v1/events/{eventId}/regenerate-suggestions`

Manually regenerates AI community engagement questions for an existing post using the current title and description.

#### Parameters:

- `eventId` (path parameter): Numeric ID of the post

#### Response:

```json
{
  "message": "AI suggestions regenerated successfully",
  "data": {
    "id": 1,
    "title": "Community Pet Adoption Day",
    "description": "Join us for a special adoption event featuring rescued pets looking for their forever homes.",
    "images": ["https://example.com/adoption-event.jpg"],
    "suggestions": [
      "What should I bring?",
      "Any vaccination requirements?",
      "How early should I arrive?"
    ],
    "created_at": "2025-10-01T10:00:00.000Z",
    "created_by": "user-uuid",
    "users": {
      "id": "user-uuid",
      "username": "event_coordinator",
      "profile_image_link": "https://example.com/profile.jpg"
    }
  },
  "regenerated_suggestions": [
    "What should I bring?",
    "Any vaccination requirements?",
    "How early should I arrive?"
  ]
}
```

## Error Handling

All endpoints include comprehensive error handling:

- **400 Bad Request**: Invalid input data or missing required fields
- **404 Not Found**: Event does not exist (for single event operations)
- **500 Internal Server Error**: Database or server issues

### Example Error Response:

```json
{
  "error": "Event not found",
  "message": "The requested event could not be found",
  "status": 404
}
```

## Use Cases

- **Community Support Posts**: Share situations where pets or shelters need help
- **Shelter Updates**: Post about shelter conditions and needs
- **Adoption Stories**: Share happy adoption experiences and available pets
- **Medical Fundraising**: Request support for pet medical expenses
- **Lost & Found**: Help locate missing pets or reunite found pets
- **Volunteer Coordination**: Share volunteer opportunities and experiences
- **Pet Care Tips**: Share experiences and ask for advice
- **Emergency Situations**: Quickly mobilize community support for urgent pet needs

## Features

- **Rich Content**: Support for multiple images and AI-generated community suggestions
- **User Attribution**: Track event creators with user profile information
- **Search & Filter**: Find events by title or description
- **Pagination**: Efficient loading of large event lists
- **CRUD Operations**: Full create, read, update, delete functionality
- **AI-Powered Suggestions**: Automatic generation of relevant, pet-focused suggestions using OpenAI
- **Smart Regeneration**: Suggestions automatically update when event details change
- **Pet-Focused Content**: AI ensures all suggestions are relevant to pet and animal events only

## AI Integration

### Automatic Suggestion Generation

- Uses OpenAI GPT-4o model to generate 3-5 short community engagement questions
- Questions are automatically created when posts are created
- Only generates pet/animal-related supportive questions
- Questions are caring and under 6 words each
- Encourages community interaction and support
- Filters out non-pet-related content automatically

### Suggestion Regeneration

- Automatic: When title or description is updated via PUT request
- Manual: Use the dedicated regenerate endpoint for fresh suggestions
- Intelligent: Only regenerates when content actually changes

### Environment Setup

Make sure to set your OpenAI API key in environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```
