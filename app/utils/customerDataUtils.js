/**
 * Utility functions for customer data processing and validation
 */

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
      id: edge.node.id.split('/').pop(),
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

/**
 * Fetches customers with pagination and error handling
 * @param {Object} admin - Shopify admin API client
 * @param {number} maxCustomers - Maximum number of customers to fetch
 * @param {number} batchSize - Number of customers per batch
 * @returns {Promise<Object>} Object containing customers and metadata
 */
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
//     
//     const countData = await countResponse.json();
//     const hasCustomers = countData.data.customers.pageInfo.hasNextPage;
//     
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
//       
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
//     
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
 * Fetches customers from the "Pet Profile" segment with pagination and error handling
 * @param {Object} admin - Shopify admin API client
 * @param {number} maxCustomers - Maximum number of customers to fetch
 * @param {number} batchSize - Number of customers per batch
 * @returns {Promise<Object>} Object containing customers and metadata
 */
export const fetchCustomersWithPagination = async (admin, maxCustomers = 1000, batchSize = 100) => {
  try {
    // First, find the "Pet Profile" segment
    const segmentResponse = await admin.graphql(`
      query getPetProfileSegment {
        segments(first: 10, query: "name:Pet Profile") {
          edges {
            node {
              id
              name
              query
            }
          }
        }
      }
    `);
    
    const segmentData = await segmentResponse.json();
    
    if (segmentData.errors) {
      console.error('GraphQL errors:', segmentData.errors);
      throw new Error('Failed to fetch segment data');
    }
    
    const petProfileSegment = segmentData.data.segments.edges.find(
      edge => edge.node.name === "Pet Profile"
    );
    
    if (!petProfileSegment) {
      console.warn('Pet Profile segment not found');
      return { 
        customers: [],
        totalCustomers: 0,
        error: 'Pet Profile segment not found',
        paginationInfo: {
          hasMore: false,
          totalFetched: 0,
          maxCustomers
        }
      };
    }
    
    console.log('Found Pet Profile segment:', petProfileSegment.node.id);
    console.log('Segment query:', petProfileSegment.node.query);

    // Use CustomerSegmentMember to directly fetch segment members
    // This is the proper way to get customers from a segment
    let allCustomers = [];
    let hasNextPage = true;
    let cursor = null;
    let totalFetched = 0;

    while (hasNextPage && totalFetched < maxCustomers) {
      const response = await admin.graphql(`
        query getSegmentMembers($segmentId: ID!, $first: Int!, $after: String) {
          customerSegmentMembers(segmentId: $segmentId, first: $first, after: $after) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              node {
                id
                firstName
                lastName
                displayName
                numberOfOrders
                amountSpent {
                  amount
                  currencyCode
                }
                metafields(namespace: "variables") {
                  edges {
                    node {
                      key
                      value
                    }
                  }
                }
              }
            }
          }
        }
      `, {
        variables: {
          segmentId: petProfileSegment.node.id,
          first: batchSize,
          after: cursor
        }
      });

      const responseJson = await response.json();
      
      if (responseJson.errors) {
        console.error('GraphQL errors:', responseJson.errors);
        throw new Error('Failed to fetch segment members');
      }

      const segmentMembers = responseJson.data.customerSegmentMembers.edges;
      
      // Process the segment members to match our expected customer format
      const customers = segmentMembers.map(edge => {
        const member = edge.node;
        
        // Extract metafields
        const metafields = {};
        if (member.metafields && member.metafields.edges) {
          member.metafields.edges.forEach(metafieldEdge => {
            const metafield = metafieldEdge.node;
            metafields[metafield.key] = metafield.value;
          });
        }
        
        return {
          id: member.id.split('/').pop(),
          gid: member.id,
          firstName: member.firstName || '',
          lastName: member.lastName || '',
          email: '', // Email not available in CustomerSegmentMember query
          displayName: member.displayName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Customer',
          numberOfOrders: member.numberOfOrders || 0,
          amountSpent: member.amountSpent ? {
            amount: member.amountSpent.amount || '0.0',
            currencyCode: member.amountSpent.currencyCode || 'USD'
          } : null,
          pet_type: sanitizeMetafieldValue(metafields.pet_type),
          stress_level: sanitizeMetafieldValue(metafields.stress_level),
          drug_usage: sanitizeMetafieldValue(metafields.drug_usage),
          pet_age: sanitizeMetafieldValue(metafields.pet_age),
          pet_weight: sanitizeMetafieldValue(metafields.pet_weight),
        };
      });
      
      allCustomers = allCustomers.concat(customers);
      hasNextPage = responseJson.data.customerSegmentMembers.pageInfo.hasNextPage;
      cursor = responseJson.data.customerSegmentMembers.pageInfo.endCursor;
      totalFetched += customers.length;

      console.log(`Fetched ${customers.length} segment members. Total: ${allCustomers.length}`);

      // Add a small delay to respect API rate limits
      if (hasNextPage && totalFetched < maxCustomers) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { 
      customers: allCustomers,
      totalCustomers: allCustomers.length,
      error: null,
      paginationInfo: {
        hasMore: hasNextPage,
        totalFetched,
        maxCustomers
      }
    };

  } catch (error) {
    console.error('Error fetching customer data from segment:', error);
    
    return { 
      customers: [],
      totalCustomers: 0,
      error: error.message,
      paginationInfo: {
        hasMore: false,
        totalFetched: 0,
        maxCustomers
      }
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