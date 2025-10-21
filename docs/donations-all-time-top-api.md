# All-Time Top Donors API

Returns the top donors across all time, excluding anonymous donations and users without an ID. Results are grouped by donor and sorted by total amount with a maximum of 10 users.

- Method: GET
- Path: `/api/v1/donations/top`

## Parameters

There are no query parameters. The API always:

- Aggregates all donations historically
- Sorts by total donated amount (ties broken by count then recency)
- Returns up to 10 donors
- Includes donations whether or not they’re linked to a fundraising campaign (fundraising can be null)

## Response

```json
{
  "message": "Success",
  "data": [
    {
      "rank": 1,
      "user": {
        "id": "uuid",
        "username": "Alice",
        "email": "alice@example.com",
        "profile_image_link": null
      },
      "totals": {
        "amount": 8000,
        "count": 12,
        "last_donated_at": "2025-10-18T12:34:56.000Z"
      }
    }
  ],
  "meta": {
    "range": "all",
    "limit": 10,
    "sort": "amount",
    "fundraising": null,
    "generated_at": "2025-10-21T10:00:00.000Z"
  }
}
```

Notes:

- Anonymous donations (is_anonymous = true) are excluded.
- Donations without a donor ID are excluded.
- Ties are broken by donation count and most recent donation time.
