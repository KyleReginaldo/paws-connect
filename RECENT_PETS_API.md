# Recent Pets API Documentation

## Endpoint

`GET /api/v1/pets/recent`

## Purpose

Fetches recently added pets from the database with configurable time periods and filtering options. This endpoint is perfect for displaying "newest pets" on homepage, dashboards, or recent activity feeds.

## Query Parameters

| Parameter        | Type   | Required | Default | Description                                            |
| ---------------- | ------ | -------- | ------- | ------------------------------------------------------ |
| `limit`          | number | No       | 10      | Number of pets to return (max: 100)                    |
| `days_back`      | number | No       | 7       | Number of days to look back for recent pets            |
| `request_status` | string | No       | -       | Filter by request status (e.g., 'approved', 'pending') |

## Usage Examples

### Basic Request (Default: last 10 pets from past 7 days)

```http
GET /api/v1/pets/recent
```

### Custom Limit

```http
GET /api/v1/pets/recent?limit=20
```

### Extended Time Period

```http
GET /api/v1/pets/recent?days_back=30
```

### Status Filtering

```http
GET /api/v1/pets/recent?request_status=approved
```

### Combined Parameters

```http
GET /api/v1/pets/recent?limit=15&days_back=14&request_status=approved
```

## Response Format

### Success Response (200)

```json
{
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Buddy",
      "type": "Dog",
      "breed": "Golden Retriever",
      "gender": "Male",
      "age": 3,
      "date_of_birth": "2021-01-15",
      "size": "Large",
      "weight": "30kg",
      "is_vaccinated": true,
      "is_spayed_or_neutured": true,
      "health_status": "Healthy",
      "good_with": ["children", "cats"],
      "is_trained": true,
      "rescue_address": "123 Main St, City",
      "description": "Friendly and energetic dog",
      "special_needs": "None",
      "added_by": "550e8400-e29b-41d4-a716-446655440000",
      "request_status": "approved",
      "photo": "https://example.com/buddy.jpg",
      "created_at": "2025-09-10T14:30:00Z",
      "updated_at": "2025-09-10T14:30:00Z"
    }
  ],
  "metadata": {
    "total_returned": 1,
    "requested_limit": 10,
    "requested_days_back": 7,
    "actual_days_back": 3,
    "cutoff_date": "2025-09-06T14:30:00Z",
    "request_status_filter": null
  }
}
```

### Error Response (400/500)

```json
{
  "error": "Failed to fetch recent pets",
  "message": "Database connection error"
}
```

## Response Metadata

The `metadata` object provides useful information about the query:

- **total_returned**: Number of pets actually returned
- **requested_limit**: The limit parameter that was requested
- **requested_days_back**: The days_back parameter that was requested
- **actual_days_back**: Actual days between now and the oldest returned pet
- **cutoff_date**: The calculated cutoff date for "recent" pets
- **request_status_filter**: The status filter that was applied (if any)

## Use Cases

### 1. Homepage "Recently Added Pets"

```javascript
// Show latest 6 approved pets for homepage
const response = await fetch('/api/v1/pets/recent?limit=6&request_status=approved');
const { data: recentPets } = await response.json();
```

### 2. Admin Dashboard - New Submissions

```javascript
// Show latest 20 pending pets for admin review
const response = await fetch('/api/v1/pets/recent?limit=20&request_status=pending');
const { data: pendingPets } = await response.json();
```

### 3. Activity Feed - Last 30 Days

```javascript
// Show all pets added in the last 30 days
const response = await fetch('/api/v1/pets/recent?days_back=30&limit=50');
const { data: monthlyPets } = await response.json();
```

### 4. Weekly Newsletter Content

```javascript
// Get pets from the past week for newsletter
const response = await fetch('/api/v1/pets/recent?days_back=7&request_status=approved');
const { data: weeklyPets } = await response.json();
```

## Key Features

1. **Time-Based Filtering**: Automatically filters pets based on creation date
2. **Configurable Limits**: Control exactly how many pets to return
3. **Status Filtering**: Filter by approval status for different use cases
4. **Metadata Rich**: Provides context about the query results
5. **Performance Optimized**: Uses database-level filtering and ordering
6. **Validation**: Input validation with sensible defaults and limits

## Differences from Main Pets Endpoint

| Feature            | `/api/v1/pets`    | `/api/v1/pets/recent`  |
| ------------------ | ----------------- | ---------------------- |
| **Time Filtering** | None              | Configurable days back |
| **Default Limit**  | All pets          | 10 pets                |
| **Max Limit**      | Unlimited         | 100 pets               |
| **Metadata**       | Basic             | Rich metadata          |
| **Use Case**       | Full pet listings | Recent activity feeds  |

## Performance Considerations

- **Database Indexed**: Queries use `created_at` which should be indexed
- **Limited Results**: Maximum 100 pets prevents large data transfers
- **Efficient Ordering**: Database-level sorting by creation date
- **Time-Based Cutoff**: Reduces query scope to recent timeframe

## Integration Examples

### React Component

```tsx
import { useEffect, useState } from 'react';

function RecentPets() {
  const [recentPets, setRecentPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPets = async () => {
      try {
        const response = await fetch('/api/v1/pets/recent?limit=8&request_status=approved');
        const { data } = await response.json();
        setRecentPets(data);
      } catch (error) {
        console.error('Error fetching recent pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPets();
  }, []);

  if (loading) return <div>Loading recent pets...</div>;

  return (
    <div className="recent-pets">
      <h2>Recently Added Pets</h2>
      <div className="pets-grid">
        {recentPets.map((pet) => (
          <div key={pet.id} className="pet-card">
            <img src={pet.photo} alt={pet.name} />
            <h3>{pet.name}</h3>
            <p>
              {pet.breed} • {pet.age} years old
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

This endpoint provides a clean, efficient way to fetch recently added pets with the flexibility to customize the time period, limit, and filtering based on your specific needs!
