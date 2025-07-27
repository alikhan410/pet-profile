import { authenticate, unauthenticated } from '../shopify.server';

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
  console.log("[pet-profile] Authenticating request...");
  const { cors, sessionToken } = await authenticate.public.customerAccount(request);
  console.log("[pet-profile] Authentication result:", sessionToken);
  if (!sessionToken?.dest || !sessionToken?.sub) {
    console.error("[pet-profile] Invalid session token", sessionToken);
    return cors(new Response(JSON.stringify({ error: "Invalid session token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }));
  }

  const shop = sessionToken.dest;             // e.g. "your-store.myshopify.com"
  const customerGID = sessionToken.sub;       // e.g. "gid://shopify/Customer/1234567890"
  const customerId = customerGID.split('/').pop();  // e.g. "1234567890" (numeric ID if needed)

  const body = await request.json();
  console.log("[pet-profile] Incoming data:", body);

  try {
    // Use Admin GraphQL API to save metafields
    const mutation = `#graphql
    mutation SavePetProfile($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
    const metafieldsInput = [
      { ownerId: customerGID, namespace: "variables", key: "pet_type", value: body.pet_type, type: "single_line_text_field" },
      { ownerId: customerGID, namespace: "variables", key: "stress_level", value: body.stress_level, type: "single_line_text_field" },
      { ownerId: customerGID, namespace: "variables", key: "drug_usage", value: body.drug_usage, type: "single_line_text_field" },
      { ownerId: customerGID, namespace: "variables", key: "pet_age", value: body.pet_age, type: "single_line_text_field" },
      { ownerId: customerGID, namespace: "variables", key: "pet_weight", value: body.pet_weight, type: "single_line_text_field" },
    ];
    

    console.log("[pet-profile] Getting unauthenticated admin context for shop:", shop);
    const { admin } = await unauthenticated.admin(shop);
    console.log("[pet-profile] Sending mutation to Shopify Admin API via admin.graphql...");

    const response = await admin.graphql(mutation, {
      variables: { metafields: metafieldsInput },
    });

    const result = await response.json();
    console.log("[pet-profile] Shopify API response:", result);
    const errors = result.data?.metafieldsSet?.userErrors;
    if (errors && errors.length) {
      console.error("[pet-profile] Shopify API userErrors:", errors);
      throw new Error(errors.map(e => e.message).join(", "));
    }

    console.log(`[pet-profile] Saved metafields for customer ${customerId} on ${shop}`);
    return cors(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
  } catch (err) {
    console.error("[pet-profile] Error saving metafields:", err);
    return cors(new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }));
  }
};