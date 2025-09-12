# Pets Filtering API Documentation

## Endpoint

`GET /api/v1/pets`

## Purpose

Fetch pets from the database with comprehensive filtering, search, and pagination capabilities. This enhanced endpoint allows for precise pet discovery based on various criteria.

## Query Parameters

### Basic Filters

| Parameter        | Type   | Description                                       | Example                    |
| ---------------- | ------ | ------------------------------------------------- | -------------------------- |
| `type`           | string | Filter by pet type (case-insensitive)             | `?type=dog`                |
| `breed`          | string | Filter by breed (case-insensitive, partial match) | `?breed=golden`            |
| `gender`         | string | Filter by gender (case-insensitive)               | `?gender=male`             |
| `size`           | string | Filter by size (case-insensitive)                 | `?size=large`              |
| `health_status`  | string | Filter by health status (case-insensitive)        | `?health_status=healthy`   |
| `request_status` | string | Filter by approval status (exact match)           | `?request_status=approved` |

### Age Filters

| Parameter | Type   | Description          | Example      |
| --------- | ------ | -------------------- | ------------ |
| `age_min` | number | Minimum age in years | `?age_min=1` |
| `age_max` | number | Maximum age in years | `?age_max=5` |

### Boolean Filters

| Parameter               | Type    | Description                  | Example                       |
| ----------------------- | ------- | ---------------------------- | ----------------------------- |
| `is_vaccinated`         | boolean | Filter by vaccination status | `?is_vaccinated=true`         |
| `is_spayed_or_neutured` | boolean | Filter by spay/neuter status | `?is_spayed_or_neutured=true` |
| `is_trained`            | boolean | Filter by training status    | `?is_trained=true`            |

### Special Filters

| Parameter   | Type   | Description                                         | Example               |
| ----------- | ------ | --------------------------------------------------- | --------------------- |
| `good_with` | string | Filter pets good with specific groups               | `?good_with=children` |
| `location`  | string | Filter by rescue address (case-insensitive)         | `?location=seattle`   |
| `search`    | string | Global search across name, description, breed, type | `?search=friendly`    |

### Pagination

| Parameter | Type   | Description                            | Example      |
| --------- | ------ | -------------------------------------- | ------------ |
| `limit`   | number | Number of results to return (max: 100) | `?limit=20`  |
| `offset`  | number | Number of results to skip              | `?offset=40` |

## Usage Examples

### 1. Basic Type Filter

```http
GET /api/v1/pets?type=dog
```

### 2. Multiple Filters

```http
GET /api/v1/pets?type=dog&size=large&is_vaccinated=true
```

### 3. Age Range Filter

```http
GET /api/v1/pets?age_min=1&age_max=3
```

### 4. Location-Based Search

```http
GET /api/v1/pets?location=seattle&request_status=approved
```

### 5. Good With Children

```http
GET /api/v1/pets?good_with=children&is_trained=true
```

### 6. Global Search

```http
GET /api/v1/pets?search=golden retriever friendly
```

### 7. Pagination with Filters

```http
GET /api/v1/pets?type=cat&limit=10&offset=20
```

### 8. Complex Filter Combination

```http
GET /api/v1/pets?type=dog&breed=labrador&age_min=2&age_max=6&is_vaccinated=true&good_with=children&location=portland&limit=15
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
      "rescue_address": "123 Main St, Seattle, WA",
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
    "total_count": 150,
    "returned_count": 1,
    "applied_filters": {
      "type": "dog",
      "breed": null,
      "gender": null,
      "size": "large",
      "age_range": {
        "min": "2",
        "max": "5"
      },
      "is_vaccinated": true,
      "is_spayed_or_neutured": null,
      "is_trained": null,
      "health_status": null,
      "request_status": "approved",
      "good_with": "children",
      "location": null,
      "search": null
    },
    "pagination": {
      "limit": 20,
      "offset": 0
    }
  }
}
```

### Error Response (500)

```json
{
  "error": "Failed to fetch pets",
  "message": "Database connection error"
}
```

## Filter Behavior

### Case Sensitivity

- **Case-insensitive**: `type`, `breed`, `gender`, `size`, `health_status`, `location`, `search`
- **Case-sensitive**: `request_status`, `good_with`

### Matching Types

- **Partial match (ILIKE)**: `type`, `breed`, `gender`, `size`, `health_status`, `location`
- **Exact match**: `request_status`, boolean filters
- **Array contains**: `good_with`
- **Global search**: `search` (searches across name, description, breed, type)

### Data Types

- **String filters**: Use partial matching for flexible search
- **Boolean filters**: Accept `"true"` or `"false"` as strings
- **Number filters**: Parse integers for age ranges
- **Array filters**: `good_with` searches within the array field

## Real-World Use Cases

### 1. Adoption Page Filters

```javascript
// User searching for small, vaccinated dogs good with children
const searchParams = new URLSearchParams({
  type: 'dog',
  size: 'small',
  is_vaccinated: 'true',
  good_with: 'children',
  request_status: 'approved',
  limit: '12',
});

const response = await fetch(`/api/v1/pets?${searchParams}`);
```

### 2. Admin Dashboard - Pending Approvals

```javascript
// Admin reviewing pending pet submissions
const response = await fetch('/api/v1/pets?request_status=pending&limit=50');
```

### 3. Breed-Specific Search

```javascript
// User looking for golden retrievers in their area
const response = await fetch('/api/v1/pets?breed=golden&location=portland&request_status=approved');
```

### 4. Age-Appropriate Pets

```javascript
// Family looking for young, trained pets
const response = await fetch('/api/v1/pets?age_min=1&age_max=4&is_trained=true&good_with=children');
```

### 5. Health-Conscious Search

```javascript
// User specifically wanting vaccinated and spayed/neutered pets
const response = await fetch(
  '/api/v1/pets?is_vaccinated=true&is_spayed_or_neutured=true&health_status=healthy',
);
```

### 6. Text Search with Pagination

```javascript
// Search for "friendly lab" with pagination
const response = await fetch('/api/v1/pets?search=friendly lab&limit=10&offset=20');
```

## Frontend Integration Examples

### React Hook for Pet Filtering

```tsx
import { useState, useEffect } from 'react';

interface PetFilters {
  type?: string;
  breed?: string;
  size?: string;
  age_min?: number;
  age_max?: number;
  is_vaccinated?: boolean;
  good_with?: string;
  location?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function usePetFilters(filters: PetFilters) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const fetchFilteredPets = async () => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();

        // Add non-null filters to search params
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString());
          }
        });

        const response = await fetch(`/api/v1/pets?${searchParams}`);
        const result = await response.json();

        setPets(result.data);
        setMetadata(result.metadata);
      } catch (error) {
        console.error('Error fetching filtered pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredPets();
  }, [filters]);

  return { pets, loading, metadata };
}

// Usage in component
function PetSearch() {
  const [filters, setFilters] = useState<PetFilters>({
    type: 'dog',
    is_vaccinated: true,
    limit: 12,
  });

  const { pets, loading, metadata } = usePetFilters(filters);

  const updateFilter = (key: keyof PetFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="filters">
        <select onChange={(e) => updateFilter('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="dog">Dogs</option>
          <option value="cat">Cats</option>
        </select>

        <select onChange={(e) => updateFilter('size', e.target.value)}>
          <option value="">All Sizes</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>

        <input
          type="text"
          placeholder="Search pets..."
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      {loading ? (
        <div>Loading pets...</div>
      ) : (
        <div>
          <p>Found {metadata?.total_count} pets</p>
          <div className="pets-grid">
            {pets.map((pet) => (
              <div key={pet.id} className="pet-card">
                <img src={pet.photo} alt={pet.name} />
                <h3>{pet.name}</h3>
                <p>
                  {pet.breed} • {pet.age} years old
                </p>
                <p>
                  {pet.size} • {pet.gender}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

### Database Optimization

- **Indexes recommended** on frequently filtered columns:
  - `type`, `breed`, `size`, `gender`
  - `age`, `request_status`
  - `is_vaccinated`, `is_spayed_or_neutured`, `is_trained`
  - `created_at` (for default sorting)

### Query Limits

- **Maximum limit**: 100 pets per request
- **Default behavior**: No limit if not specified
- **Pagination**: Use `limit` and `offset` for large datasets

### Filter Performance

- **String filters**: Use ILIKE for case-insensitive partial matching
- **Boolean filters**: Direct equality comparisons (fastest)
- **Array filters**: Use `contains` operator for `good_with` array field
- **Global search**: OR query across multiple text fields (moderate performance)

## API Design Benefits

1. **Flexible Filtering** - Support for all major pet attributes
2. **Intuitive Parameters** - Query parameters match database fields
3. **Performance Aware** - Pagination and query limits prevent overload
4. **Rich Metadata** - Response includes filter summary and counts
5. **Frontend Friendly** - Easy integration with form controls and state
6. **Backward Compatible** - No parameters returns all pets (existing behavior)

This comprehensive filtering system allows users to find exactly the pets they're looking for while maintaining good performance and developer experience!
