/**
 * Utility functions for customer data processing and validation
 */

/**
 * Extracts the numeric ID from a Shopify GID (Global ID)
 * @param {string} gid - Shopify Global ID (e.g., "gid:/shopify/CustomerSegmentMember/8483087548635")
 * @returns {string} The numeric ID part
 * 
 * Examples:
 * extractIdFromGid("gid:/shopify/CustomerSegmentMember/8483087548635") => "8483087548635"
 * extractIdFromGid("gid://shopify/Customer/123456789") => "123456789"
 * extractIdFromGid("gid://shopify/SomeOtherType/987654321") => "987654321"
 * extractIdFromGid("123456789") => "123456789" (fallback for plain IDs)
 */
export const extractIdFromGid = (gid) => {
  if (!gid || typeof gid !== 'string') return '';
  
  // Handle different GID formats
  const patterns = [
    /gid:\/\/shopify\/CustomerSegmentMember\/(\d+)/,
    /gid:\/\/shopify\/Customer\/(\d+)/,
    /gid:\/\/shopify\/(\w+)\/(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = gid.match(pattern);
    if (match) {
      return match[match.length - 1]; // Return the last captured group (the numeric ID)
    }
  }
  
  // Fallback: try to extract any numeric part
  const numericMatch = gid.match(/(\d+)$/);
  return numericMatch ? numericMatch[1] : gid;
};

/**
 * Validates customer data for required fields and data types
 * @param {Object} customer - Customer object to validate
 * @returns {Array} Array of validation error messages
 */
export const validateCustomerData = (customer) => {
  const errors = [];
  
  // Check for required fields
  if (!customer.email) errors.push('Missing email');
  if (!customer.id) errors.push('Missing customer ID');
  
  // Validate metafield values
  const metafields = ['pet_type', 'stress_level', 'drug_usage', 'pet_age', 'pet_weight'];
  metafields.forEach(field => {
    if (customer[field] && typeof customer[field] !== 'string') {
      errors.push(`Invalid ${field} data type`);
    }
  });
  
  return errors;
};

/**
 * Sanitizes metafield values to ensure they are clean strings
 * @param {*} value - Raw metafield value
 * @returns {string} Sanitized string value
 */
export const sanitizeMetafieldValue = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim();
};

/**
 * Checks if a customer has a complete profile
 * @param {Object} customer - Customer object to check
 * @returns {boolean} True if profile is complete
 */
export const isCompleteProfile = (customer) => {
  const requiredFields = ['pet_type', 'stress_level', 'drug_usage', 'pet_age', 'pet_weight'];
  return requiredFields.every(field => {
    const value = customer[field];
    return value && value.trim() !== '';
  });
};

/**
 * Calculates profile completeness percentage
 * @param {Object} customer - Customer object
 * @returns {number} Completeness percentage (0-100)
 */
export const getProfileCompleteness = (customer) => {
  const fields = ['pet_type', 'stress_level', 'drug_usage', 'pet_age', 'pet_weight'];
  const completedFields = fields.filter(field => customer[field] && customer[field].trim() !== '');
  return Math.round((completedFields.length / fields.length) * 100);
};

/**
 * Processes raw customer data from GraphQL response
 * @param {Array} edges - GraphQL edges array
 * @returns {Array} Processed customer objects
 */
export const processCustomerData = (edges) => {
  return edges.map(edge => {
    const customer = {
      id: extractIdFromGid(edge.node.id),
      gid: edge.node.id,
      firstName: edge.node.firstName || '',
      lastName: edge.node.lastName || '',
      email: edge.node.email || '',
      state: edge.node.state || '',
      verifiedEmail: edge.node.verifiedEmail || false,
      numberOfOrders: edge.node.numberOfOrders || 0,
      createdAt: edge.node.createdAt,
      updatedAt: edge.node.updatedAt,
      pet_type: sanitizeMetafieldValue(edge.node.pet_type?.value),
      stress_level: sanitizeMetafieldValue(edge.node.stress_level?.value),
      drug_usage: sanitizeMetafieldValue(edge.node.drug_usage?.value),
      pet_age: sanitizeMetafieldValue(edge.node.pet_age?.value),
      pet_weight: sanitizeMetafieldValue(edge.node.pet_weight?.value),
    };

    // Validate customer data
    const validationErrors = validateCustomerData(customer);
    if (validationErrors.length > 0) {
      console.warn(`Customer ${customer.id} has validation errors:`, validationErrors);
    }

    return customer;
  });
};

/**
 * Calculates data quality metrics for a set of customers
 * @param {Array} customers - Array of customer objects
 * @returns {Object} Data quality metrics
 */
export const calculateDataQuality = (customers) => {
  const completeProfiles = customers.filter(isCompleteProfile).length;
  const incompleteProfiles = customers.length - completeProfiles;
  
  const missingData = {
    pet_type: customers.filter(c => !c.pet_type || c.pet_type.trim() === '').length,
    stress_level: customers.filter(c => !c.stress_level || c.stress_level.trim() === '').length,
    drug_usage: customers.filter(c => !c.drug_usage || c.drug_usage.trim() === '').length,
    pet_age: customers.filter(c => !c.pet_age || c.pet_age.trim() === '').length,
    pet_weight: customers.filter(c => !c.pet_weight || c.pet_weight.trim() === '').length,
  };

  return {
    completeProfiles,
    incompleteProfiles,
    missingData
  };
};

// /**
//  * Fetches customers with pagination and error handling
//  * @param {Object} admin - Shopify admin API client
//  * @param {number} maxCustomers - Maximum number of customers to fetch
//  * @param {number} batchSize - Number of customers per batch
//  * @returns {Promise<Object>} Object containing customers and metadata
//  */
// export const fetchCustomersWithPagination = async (admin, maxCustomers = 1000, batchSize = 100) => {
//   try {
//     // Get total customer count first
//     const countResponse = await admin.graphql(`
//       query getCustomerCount {
//         customers(first: 1) {
//           pageInfo {
//             hasNextPage
//           }
//         }
//       }
//     `);
    
//     const countData = await countResponse.json();
//     const hasCustomers = countData.data.customers.pageInfo.hasNextPage;
    
//     if (!hasCustomers) {
//       return { 
//         customers: [],
//         totalCustomers: 0,
//         error: null,
//         paginationInfo: {
//           hasMore: false,
//           totalFetched: 0,
//           maxCustomers
//         }
//       };
//     }

//     // Fetch customers with pagination
//     let allCustomers = [];
//     let hasNextPage = true;
//     let cursor = null;
//     let totalFetched = 0;

//     while (hasNextPage && totalFetched < maxCustomers) {
//       const response = await admin.graphql(`
//         query getCustomersWithPetProfiles($first: Int!, $after: String) {
//           customers(first: $first, after: $after) {
//             pageInfo {
//               hasNextPage
//               hasPreviousPage
//               startCursor
//               endCursor
//             }
//             edges {
//               node {
//                 id
//                 firstName
//                 lastName
//                 email
//                 createdAt
//                 updatedAt
//                 state
//                 verifiedEmail
//                 numberOfOrders
//                 pet_type: metafield(namespace: "variables", key: "pet_type") {
//                   value
//                 }
//                 stress_level: metafield(namespace: "variables", key: "stress_level") {
//                   value
//                 }
//                 drug_usage: metafield(namespace: "variables", key: "drug_usage") {
//                   value
//                 }
//                 pet_age: metafield(namespace: "variables", key: "pet_age") {
//                   value
//                 }
//                 pet_weight: metafield(namespace: "variables", key: "pet_weight") {
//                   value
//                 }
//               }
//             }
//           }
//         }
//       `, {
//         variables: {
//           first: batchSize,
//           after: cursor
//         }
//       });

//       const responseJson = await response.json();
      
//       if (responseJson.errors) {
//         console.error('GraphQL errors:', responseJson.errors);
//         throw new Error('Failed to fetch customer data');
//       }

//       const customers = processCustomerData(responseJson.data.customers.edges);
//       allCustomers = allCustomers.concat(customers);
//       hasNextPage = responseJson.data.customers.pageInfo.hasNextPage;
//       cursor = responseJson.data.customers.pageInfo.endCursor;
//       totalFetched += customers.length;

//       // Add a small delay to respect API rate limits
//       if (hasNextPage && totalFetched < maxCustomers) {
//         await new Promise(resolve => setTimeout(resolve, 100));
//       }
//     }

//     return { 
//       customers: allCustomers,
//       totalCustomers: allCustomers.length,
//       error: null,
//       paginationInfo: {
//         hasMore: hasNextPage,
//         totalFetched,
//         maxCustomers
//       }
//     };

//   } catch (error) {
//     console.error('Error fetching customer data:', error);
    
//     return { 
//       customers: [],
//       totalCustomers: 0,
//       error: error.message,
//       paginationInfo: {
//         hasMore: false,
//         totalFetched: 0,
//         maxCustomers
//       }
//     };
//   }
// };

/**
 * Fetches customers from a specific Shopify segment with pagination and error handling
 * @param {Object} admin - Shopify admin API client
 * @param {number} maxCustomers - Maximum number of customers to fetch
 * @param {number} batchSize - Number of customers per batch
 * @returns {Promise<Object>} Object containing customers and metadata
 */
export const fetchCustomersWithPagination = async (
  admin,
  maxCustomers = 1000,
  batchSize = 100
) => {
  const segmentGID = "gid://shopify/Segment/537319178459"; // Pet Profile segment

  try {
    let allCustomers = [];
    let hasNextPage = true;
    let cursor = null;
    let totalFetched = 0;

    while (hasNextPage && totalFetched < maxCustomers) {
      const response = await admin.graphql(
        `
        query getSegmentCustomers($first: Int!, $after: String, $segmentId: ID!) {
          customerSegmentMembers(first: $first, after: $after, segmentId: $segmentId) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                firstName
                lastName
                defaultEmailAddress {
                  emailAddress
                }
                pet_type: metafield(namespace: "variables", key: "pet_type") { value }
                stress_level: metafield(namespace: "variables", key: "stress_level") { value }
                drug_usage: metafield(namespace: "variables", key: "drug_usage") { value }
                pet_age: metafield(namespace: "variables", key: "pet_age") { value }
                pet_weight: metafield(namespace: "variables", key: "pet_weight") { value }
              }
            }
          }
        }
      `,
        {
          variables: {
            first: batchSize,
            after: cursor,
            segmentId: segmentGID,
          },
        }
      );

      const responseJson = await response.json();

      if (responseJson.errors) {
        console.error("GraphQL errors:", responseJson.errors);
        throw new Error("Failed to fetch segment customer data");
      }

      const segmentMembers = responseJson.data.customerSegmentMembers;
      const customers = segmentMembers.edges.map(({ node }) => ({
        id: extractIdFromGid(node.id),
        firstName: node.firstName,
        lastName: node.lastName,
        email: node.defaultEmailAddress?.emailAddress || null,
        pet_type: node.pet_type?.value || null,
        stress_level: node.stress_level?.value || null,
        drug_usage: node.drug_usage?.value || null,
        pet_age: node.pet_age?.value || null,
        pet_weight: node.pet_weight?.value || null,
      }));

      allCustomers = allCustomers.concat(customers);
      hasNextPage = segmentMembers.pageInfo.hasNextPage;
      cursor = segmentMembers.pageInfo.endCursor;
      totalFetched += customers.length;

      if (hasNextPage && totalFetched < maxCustomers) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Respect rate limits
      }
    }

    return {
      customers: allCustomers,
      totalCustomers: allCustomers.length,
      error: null,
      paginationInfo: {
        hasMore: hasNextPage,
        totalFetched,
        maxCustomers,
      },
    };
  } catch (error) {
    console.error("Error fetching segment customer data:", error);
    return {
      customers: [],
      totalCustomers: 0,
      error: error.message,
      paginationInfo: {
        hasMore: false,
        totalFetched: 0,
        maxCustomers,
      },
    };
  }
};


/**
 * Generates dimension data for charts based on customer data
 * @param {Array} customers - Array of customer objects
 * @returns {Object} Dimension data for different chart types
 */
export const generateDimensionData = (customers) => {
  if (customers.length === 0) {
    return {
      pet_age: [],
      drug_usage: [],
      pet_weight: [],
      pet_type: [],
      stress_level: []
    };
  }

  const petAgeData = [
    { name: '1-6', customers: parseInt(customers.filter(c => c.pet_age === '1-6').length) },
    { name: '7-12', customers: parseInt(customers.filter(c => c.pet_age === '7-12').length) },
    { name: '13-20', customers: parseInt(customers.filter(c => c.pet_age === '13-20').length) }
  ];

  const drugUsageData = [
    { name: 'Allergies', customers: parseInt(customers.filter(c => c.drug_usage && c.drug_usage.toLowerCase().includes('allergies')).length) },
    { name: 'Gut Health and Immune Support', customers: parseInt(customers.filter(c => c.drug_usage === 'Gut Health and Immune Support').length) },
    { name: 'Hip and Joint Health', customers: parseInt(customers.filter(c => c.drug_usage === 'Hip and Joint Health').length) },
    { name: 'Longevity', customers: parseInt(customers.filter(c => c.drug_usage === 'Longevity').length) },
    { name: 'Anxiety', customers: parseInt(customers.filter(c => c.drug_usage === 'Anxiety').length) },
    { name: 'Skin or Paw Irritation', customers: parseInt(customers.filter(c => c.drug_usage === 'Skin or Paw Irritation').length) }
  ].filter(d => d.customers > 0);

  const petWeightData = [
    { name: 'Under 20lbs', customers: parseInt(customers.filter(c => c.pet_weight === 'under 20lbs').length) },
    { name: '20-50lbs', customers: parseInt(customers.filter(c => c.pet_weight === '20-50lbs').length) },
    { name: '50+lbs', customers: parseInt(customers.filter(c => c.pet_weight === '50+lbs').length) }
  ];

  const petSpeciesData = [
    { name: 'Dog', customers: parseInt(customers.filter(c => c.pet_type === 'Dog').length) },
    { name: 'Cat', customers: parseInt(customers.filter(c => c.pet_type === 'Cat').length) },
    { name: 'Small Animal', customers: parseInt(customers.filter(c => c.pet_type === 'small animal').length) }
  ];

  const stressLevelData = [
    { name: 'Low', customers: parseInt(customers.filter(c => c.stress_level === 'low discomfort or stress').length) },
    { name: '2', customers: parseInt(customers.filter(c => c.stress_level === '2').length) },
    { name: 'Moderate', customers: parseInt(customers.filter(c => c.stress_level === 'moderate discomfort or stress').length) },
    { name: '4', customers: parseInt(customers.filter(c => c.stress_level === '4').length) },
    { name: 'Severe', customers: parseInt(customers.filter(c => c.stress_level === 'severe discomfort or stress').length) }
  ].filter(d => d.customers > 0);

  return {
    pet_age: petAgeData,
    drug_usage: drugUsageData,
    pet_weight: petWeightData,
    pet_type: petSpeciesData,
    stress_level: stressLevelData
  };
}; 