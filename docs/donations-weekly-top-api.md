# Weekly Top Donors API

Returns the top donors for the past 7 days, excluding anonymous donations and users without an ID. Results are grouped by donor and sorted by total amount (fixed) with a maximum of 10 users.

- Method: GET
- Path: `/api/v1/donations/weekly-top`

## Parameters

There are no query parameters. The API always:

- Uses the last 7 days (rolling window to current date)
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
        "amount": 2500,
        "count": 3,
        "last_donated_at": "2025-01-15T12:34:56.000Z"
      }
    }
  ],
  "meta": {
    "range_days": 7,
    "limit": 10,
    "sort": "amount",
    "fundraising": null,
    "generated_at": "2025-01-16T10:00:00.000Z"
  }
}
```

Notes:

- Anonymous donations (is_anonymous = true) are excluded.
- Donations without a donor ID are excluded.
- Ties are broken by donation count and most recent donation time.
