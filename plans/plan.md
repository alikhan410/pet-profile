Here is the updated implementation plan tailored to your clarified requirements:

---

# ✅ Shopify Remix App for Customer Pet Profiles (New Customer Accounts Only)

This plan outlines how to build a **Shopify Remix app** with a **Customer Account UI Extension** that:

- Works **exclusively** with the **new customer accounts** experience.
- Displays and allows **editing of pet profile data** (pet type, stress level, drug usage, age, and weight).
- Stores this data using **Customer Metafields**.
- Supports **merchant customization** of the block (e.g. titles, field visibility) via the **Shopify customer accounts editor**.

---

## 🧩 1. App Overview & Architecture

### Scope

- **Private app** for client stores.
- **Customer Account UI Extension** that renders on the **Profile page**.
- Customers can **view and update** their pet profile.
- Merchants can **customize block appearance** via settings in Shopify’s editor.

### Data Model

Store pet profile fields as **Customer metafields**, for example:

| Namespace     | Key            | Type             |
| ------------- | -------------- | ---------------- |
| `pet_profile` | `pet_type`     | single_line_text |
| `pet_profile` | `stress_level` | single_line_text |
| `pet_profile` | `drug_usage`   | single_line_text |
| `pet_profile` | `pet_age`      | integer          |
| `pet_profile` | `pet_weight`   | decimal or text  |

---

## 🛠️ 2. Tech Stack

- **Remix** for the backend app (Shopify App Template).
- **Customer Account UI Extension** using:
  - `@shopify/ui-extensions`
  - `@shopify/ui-extensions-react/customer-account`

- **GraphQL Customer Account API** for reading/writing metafields.
- **Theme or Checkout Editor (UI)** for merchant customization.

---

## 🔧 3. Development Steps

### A. Scaffold the App

```bash
npm init @shopify/app@latest
# Choose: Remix + Customer Account UI Extension
```

### B. Generate the UI Extension

```bash
cd my-app
shopify app generate extension
# Select: Customer Account UI Extension
# Name: pet-profile-ui
```

### C. Configure the Extension

In `shopify.extension.toml`:

```toml
name = "Pet Profile UI Block"
type = "customer_accounts_ui_extension"

[[extensions.targeting]]
target = "customer-account.profile.block.render"
module = "./src/index.jsx"

[extensions.settings.fields]
# Merchant customization fields
[[extensions.settings.fields]]
key = "heading"
type = "single_line_text_field"
name = "Block heading"
description = "Displayed at the top of the block"

[[extensions.settings.fields]]
key = "show_weight"
type = "boolean"
name = "Show pet weight?"
default = true

[[extensions.settings.fields]]
key = "show_drug_usage"
type = "boolean"
name = "Show drug usage?"
default = true
```

---

## ✏️ 4. Customer Extension UI – React

### Example: `src/index.jsx`

```jsx
import {
  reactExtension,
  useCustomer,
  useSettings,
  useMetafields,
  useApplyMetafieldsChange,
  TextField,
  BlockStack,
  Button,
  Text,
  Card,
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension("customer-account.profile.block.render", () => (
  <PetProfile />
));

function PetProfile() {
  const customer = useCustomer();
  const { heading, show_weight, show_drug_usage } = useSettings();
  const metafields = useMetafields({ namespace: "pet_profile" });
  const applyMetafieldsChange = useApplyMetafieldsChange();

  const handleChange = (key, value) => {
    applyMetafieldsChange({
      type: "updateMetafield",
      namespace: "pet_profile",
      key,
      value,
    });
  };

  return (
    <Card>
      <BlockStack>
        <Text>{heading || "Your Pet Profile"}</Text>
        <TextField
          label="Pet Type"
          value={metafields.pet_type || ""}
          onChange={(value) => handleChange("pet_type", value)}
        />
        <TextField
          label="Stress Level"
          value={metafields.stress_level || ""}
          onChange={(value) => handleChange("stress_level", value)}
        />
        {show_drug_usage && (
          <TextField
            label="Drug Usage"
            value={metafields.drug_usage || ""}
            onChange={(value) => handleChange("drug_usage", value)}
          />
        )}
        <TextField
          label="Pet Age"
          type="number"
          value={metafields.pet_age || ""}
          onChange={(value) => handleChange("pet_age", value)}
        />
        {show_weight && (
          <TextField
            label="Pet Weight"
            value={metafields.pet_weight || ""}
            onChange={(value) => handleChange("pet_weight", value)}
          />
        )}
        <Button onPress={() => {}}>Save</Button>
      </BlockStack>
    </Card>
  );
}
```

---

## 🎨 5. Merchant Customization

**Via Shopify Admin > Settings > Customer Accounts > Customize:**

- Merchant adds your app block to the **Profile page**.
- Configures block settings like:
  - Heading text
  - Toggle: Show/hide weight, drug usage fields

- Changes are passed into the extension via `useSettings()` hook.

---

## 🔐 6. Permissions & OAuth Scopes

Ensure the app includes:

```toml
access_scopes = "customer_read_customers, customer_write_customers"
```

Add to your Shopify App setup in `shopify.app.toml`.

---

## 🚀 7. Deployment & Installation

1. **Test locally:**

```bash
shopify app dev
```

2. **Deploy & release extension:**

```bash
shopify app deploy
```

3. **Install on client store:**
   - Send install link or install via Partners dashboard.
   - During `afterAuth`, register metafield definitions.

4. **Merchant setup steps:**
   - Navigate to **Customer Accounts Editor**.
   - Add “Pet Profile” app block to **Profile page**.
   - Customize settings (heading, toggles).
   - Publish.

---

## ✅ Optional Enhancements

- Validation rules on metafields (e.g. age must be a number).
- Avatar upload using `metaobject` or external storage.
- Support for **multiple pets** (via Shopify metaobjects).

---

## 📚 References

- [Customer Account UI Extensions Overview](https://shopify.dev/docs/api/customer-account)
- [Metafield Writes in Extensions](https://shopify.dev/docs/custom-storefronts/ui-extensions/customer-accounts/extensions/metafields)
- [Extension Settings API](https://shopify.dev/docs/custom-storefronts/ui-extensions/customer-accounts/configuration#settings-api)

---

Would you like a GitHub starter project or code template for this next?
