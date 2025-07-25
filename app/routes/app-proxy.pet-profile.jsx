import { authenticate } from '../shopify.server';

// export const action = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   const body = await request.json();
//   const { customerId, ...fields } = body;
//   console.log("body is", body);

//   if (!customerId) {
//     return { error: 'Missing customerId' };
//   }

//   // Prepare metafields for all fields except customerId
//   const metafields = Object.entries(fields).map(([key, value]) => ({
//     key,
//     value,
//     namespace: 'variables',
//     type: 'single_line_text_field',
//     ownerId: customerId,
//   }));

//   const res = await admin.graphql(`
//     mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
//       metafieldsSet(metafields: $metafields) {
//         metafields {
//           key
//           value
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }
//   `, { variables: { metafields } });

//   const data = await res.json();
//   const errors = data?.data?.metafieldsSet?.userErrors;
//   if (errors?.length) return { error: errors[0].message };

//   return { success: true };
// };
// Handles preflight (OPTIONS) CORS requests



// export const action = async ({ request }) => {
//   if (request.method === 'OPTIONS') {
//     return new Response(null, {
//       status: 204,
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//         'Access-Control-Allow-Headers': 'Content-Type',
//       },
//     });
//   }
//   const body = await request.json();
//   const { customerId, ...fields } = body;
//   console.log("body is", body);
//   return { success: true };
// }
const handleOptions = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
  export const loader = async ({ request }) => {
    if (request.method === "OPTIONS") {
      // Respond to preflight with CORS headers
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"  // Optional: cache preflight response for 1 day
        }
      });
    }
    // (Optional) For any other GET requests to this route, you can return 404 or handle accordingly
    return new Response("Not Found", { status: 404 });
  };
  
  export const action = async ({ request }) => {
    if (request.method === "OPTIONS") return handleOptions();
  
    // Authenticate request from the Customer Account extension
    const { cors, sessionToken } = await authenticate.public.customerAccount(request);
    if (!sessionToken?.dest || !sessionToken?.sub) {
      // If the token is missing or invalid, respond with 401
      return cors(new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }));
    }
  
    const shop = sessionToken.dest;             // e.g. "your-store.myshopify.com"
    const customerGID = sessionToken.sub;       // e.g. "gid://shopify/Customer/1234567890"
    const customerId = customerGID.split('/').pop();  // e.g. "1234567890" (numeric ID if needed)
  
    const body = await request.json();
    console.log("Incoming data:", body);
  
    // TODO: Initialize an Admin API client for the shop.
    // For example, using Shopify API library (GraphQL):
    // const client = new Shopify.Clients.Graphql(shop, adminAccessToken);
    // You'll need to retrieve the adminAccessToken (offline token) for the shop from your session storage or env.
  
    try {
      // Use Admin GraphQL API to save metafields
      const mutation = `
        mutation SavePetProfile($id: ID!, $metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields, ownerId: $id) {
            userErrors { field, message }
          }
        }
      `;
      const metafieldsInput = [
        { namespace: "variables", key: "pet_type", value: body.pet_type, type: "single_line_text_field" },
        { namespace: "variables", key: "stress_level", value: body.stress_level, type: "single_line_text_field" },
        { namespace: "variables", key: "drug_usage", value: body.drug_usage, type: "single_line_text_field" },
        { namespace: "variables", key: "pet_age", value: body.pet_age, type: "single_line_text_field" },
        { namespace: "variables", key: "pet_weight", value: body.pet_weight, type: "single_line_text_field" },
      ];
      // Execute the mutation (this requires a GraphQL client and the shop's admin token)
      // const response = await client.query({ data: { query: mutation, variables: { id: customerGID, metafields: metafieldsInput } } });
      // const errors = response.body.data.metafieldsSet.userErrors;
      // if (errors?.length) throw new Error(errors[0].message);
  
      console.log(`Saving metafields for customer ${customerId} on ${shop}`);
  
      // For this example, we'll skip actual API call and assume success:
      return cors(new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    } catch (err) {
      console.error("Error saving metafields:", err);
      return cors(new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }));
    }
  };