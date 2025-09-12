// Test file for pets filtering API
// Run this in a browser console or Node.js environment

const testPetsFiltering = async () => {
  const baseUrl = 'http://localhost:3000'; // Adjust as needed

  console.log('Testing Pets Filtering API...\n');

  // Test 1: Basic type filter
  console.log('1. Testing type filter (dogs only):');
  try {
    const response1 = await fetch(`${baseUrl}/api/v1/pets?type=dog&limit=5`);
    const result1 = await response1.json();
    console.log(
      `Found ${result1.metadata.total_count} dogs, showing ${result1.metadata.returned_count}`,
    );
    console.log('Applied filters:', result1.metadata.applied_filters);
  } catch (error) {
    console.error('Error testing type filter:', error);
  }

  // Test 2: Age range filter
  console.log('\n2. Testing age range filter (1-3 years):');
  try {
    const response2 = await fetch(`${baseUrl}/api/v1/pets?age_min=1&age_max=3&limit=5`);
    const result2 = await response2.json();
    console.log(
      `Found ${result2.metadata.total_count} pets aged 1-3, showing ${result2.metadata.returned_count}`,
    );
    console.log('Applied filters:', result2.metadata.applied_filters);
  } catch (error) {
    console.error('Error testing age filter:', error);
  }

  // Test 3: Boolean filters
  console.log('\n3. Testing boolean filters (vaccinated pets):');
  try {
    const response3 = await fetch(`${baseUrl}/api/v1/pets?is_vaccinated=true&limit=5`);
    const result3 = await response3.json();
    console.log(
      `Found ${result3.metadata.total_count} vaccinated pets, showing ${result3.metadata.returned_count}`,
    );
    console.log('Applied filters:', result3.metadata.applied_filters);
  } catch (error) {
    console.error('Error testing boolean filter:', error);
  }

  // Test 4: Combined filters
  console.log('\n4. Testing combined filters (small, trained dogs):');
  try {
    const response4 = await fetch(
      `${baseUrl}/api/v1/pets?type=dog&size=small&is_trained=true&limit=5`,
    );
    const result4 = await response4.json();
    console.log(
      `Found ${result4.metadata.total_count} small trained dogs, showing ${result4.metadata.returned_count}`,
    );
    console.log('Applied filters:', result4.metadata.applied_filters);
  } catch (error) {
    console.error('Error testing combined filters:', error);
  }

  // Test 5: Search functionality
  console.log('\n5. Testing global search (friendly):');
  try {
    const response5 = await fetch(`${baseUrl}/api/v1/pets?search=friendly&limit=5`);
    const result5 = await response5.json();
    console.log(
      `Found ${result5.metadata.total_count} pets matching "friendly", showing ${result5.metadata.returned_count}`,
    );
    console.log('Applied filters:', result5.metadata.applied_filters);
  } catch (error) {
    console.error('Error testing search:', error);
  }

  // Test 6: Pagination
  console.log('\n6. Testing pagination (offset 10, limit 5):');
  try {
    const response6 = await fetch(`${baseUrl}/api/v1/pets?limit=5&offset=10`);
    const result6 = await response6.json();
    console.log(`Showing pets 11-15 of ${result6.metadata.total_count}`);
    console.log('Pagination:', result6.metadata.pagination);
  } catch (error) {
    console.error('Error testing pagination:', error);
  }

  console.log('\nPets filtering tests completed!');
};

// Example usage:
// testPetsFiltering();

export default testPetsFiltering;
