# Events Management Feature Implementation

## Overview

Added a complete events management feature to the admin panel, allowing administrators and staff to create, edit, and manage community events/posts.

## Files Created

### 1. `/src/app/context/EventsContext.tsx`

- **Purpose**: React context provider for managing events state
- **Features**:
  - Event CRUD operations (Create, Read, Update, Delete)
  - Loading states and error handling
  - TypeScript interfaces for events and DTOs
  - Integration with events API endpoints

### 2. `/src/components/EventModal.tsx`

- **Purpose**: Modal component for creating and editing events
- **Features**:
  - Form validation with title required
  - Multiple image upload with drag & drop support
  - Image preview and individual removal
  - File validation (JPEG, PNG, WebP, max 5MB)
  - Integration with Supabase storage
  - Support for both create and edit modes

### 3. `/src/components/EventTable.tsx`

- **Purpose**: Table component for displaying events list
- **Features**:
  - Responsive table layout
  - Image previews with multiple image indicators
  - Creator information display
  - AI suggestions count display
  - Role-based action permissions
  - Edit and delete actions via dropdown menu

### 4. `/src/app/(pages)/(admin)/manage-events/page.tsx`

- **Purpose**: Main events management page
- **Features**:
  - Statistics dashboard (total events, with images, AI enhanced, creators)
  - Search functionality (title, description, creator)
  - Export to Excel functionality
  - Role-based permissions (Admin and Staff can manage)
  - Create new event button
  - Empty states with helpful messaging

## Files Modified

### 1. `/src/app/(pages)/(admin)/layout.tsx`

- **Changes**:
  - Added EventsProvider wrapper for admin pages
  - Added "Manage Events" navigation item with Calendar icon
  - Updated getTitle() and getSubtitle() functions for events page
  - Added mobile navigation support for events

## Features Implemented

### 1. **Event Management**

- ✅ Create new events with title, description, and multiple images
- ✅ Edit existing events with AI suggestion regeneration
- ✅ Delete events with confirmation dialog
- ✅ View all events in sortable table format

### 2. **Image Handling**

- ✅ Multiple image upload support
- ✅ Drag and drop image upload
- ✅ Image preview with grid layout
- ✅ Individual image removal
- ✅ File validation and error handling
- ✅ Integration with Supabase storage

### 3. **AI Integration**

- ✅ Displays AI-generated suggestions count
- ✅ Automatic suggestion regeneration on content changes
- ✅ Statistics showing AI-enhanced events

### 4. **User Experience**

- ✅ Search and filtering capabilities
- ✅ Export functionality for data analysis
- ✅ Statistics dashboard with key metrics
- ✅ Role-based permissions and access control
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and error handling

### 5. **Admin Integration**

- ✅ Seamless integration with existing admin layout
- ✅ Navigation in both desktop and mobile menus
- ✅ Consistent styling with other admin pages
- ✅ Permission system aligned with user roles

## API Integration

The feature integrates with existing Events API endpoints:

- `GET /api/v1/events` - Fetch events list
- `POST /api/v1/events` - Create new event
- `PUT /api/v1/events/[id]` - Update event
- `DELETE /api/v1/events/[id]` - Delete event
- `POST /api/v1/events/[id]/regenerate-suggestions` - Regenerate AI suggestions

## Database Schema

Uses the existing `events` table with fields:

- `id` (number) - Primary key
- `title` (string) - Event title
- `description` (string | null) - Event description
- `images` (string[] | null) - Array of image URLs
- `suggestions` (string[] | null) - AI-generated suggestions
- `created_at` (string) - Creation timestamp
- `created_by` (string | null) - Creator user ID
- Foreign key relationship to `users` table

## Permissions

- **Admin (role 1)**: Full access to all events management features
- **Staff (role 2)**: Full access to all events management features
- **Users (role 3)**: No access to events management (frontend restriction)

## Technical Highlights

1. **Type Safety**: Full TypeScript implementation with proper interfaces
2. **State Management**: React Context with proper loading and error states
3. **File Upload**: Robust image upload with validation and error handling
4. **Responsive Design**: Mobile-first approach with proper breakpoints
5. **Performance**: Efficient re-renders with proper React patterns
6. **Error Handling**: Comprehensive error handling with user feedback
7. **Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

1. Navigate to "Manage Events" in the admin sidebar
2. View statistics and existing events
3. Use search to filter events
4. Click "Add Event" to create new events
5. Use table actions to edit or delete events
6. Export data using the Export button

The feature is now fully integrated and ready for use by administrators and staff members.
