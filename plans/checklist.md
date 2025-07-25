# Shopify Remix Pet Profile App – Checklist & Improvements

## 📝 Checklist Plan

### 1. App Setup & Scaffolding

- [x] Scaffold a new Shopify Remix app (`npm init @shopify/app@latest`)
- [x] Choose Remix + Customer Account UI Extension during setup

### 2. Generate & Configure UI Extension

- [x] Generate Customer Account UI Extension (`shopify app generate extension`)
- [x] Name the extension (e.g., pet-profile-ui)
- [x] Configure `shopify.extension.toml`:
  - [x] Set extension type to `customer_accounts_ui_extension`
  - [x] Set target to `customer-account.profile.block.render`
  - [x] Add merchant customization fields (heading, show_weight, show_drug_usage)

### 3. Implement Extension UI

- [x] Create `src/index.jsx` for the extension
- [x] Use Shopify’s UI Extension React hooks:
  - [x] `useCustomer`
  - [x] `useSettings`
  - [x] `useMetafields`
  - [x] `useApplyMetafieldsChange`
- [x] Render fields for:
  - [x] Pet Type
  - [x] Stress Level
  - [x] Drug Usage (toggle)
  - [x] Pet Age
  - [x] Pet Weight (toggle)
- [x] Implement Save functionality

### 4. Metafield Integration

- [x] Store pet profile data in Customer metafields (namespace: `variables`)
- [x] Register metafield definitions during app install/afterAuth

### 5. Merchant Customization

- [ ] Ensure block settings (heading, toggles) are configurable via Shopify’s Customer Accounts Editor
- [ ] Use `useSettings()` to access merchant settings in the extension

### 6. Permissions & OAuth

- [ ] Add required access scopes in `shopify.app.toml`:
  - [ ] `customer_read_customers`
  - [ ] `customer_write_customers`

### 7. Testing & Deployment

- [ ] Test app locally (`shopify app dev`)
- [ ] Deploy app and extension (`shopify app deploy`)
- [ ] Install app on client store
- [ ] Add and configure the block in Customer Accounts Editor

### 8. Documentation & References

- [ ] Document setup and usage steps for merchants
- [ ] Reference Shopify docs for UI Extensions, Metafields, and Settings API

---

## 💡 Suggestions for Improvement

1. **Validation & UX:**
   - Add client-side validation (e.g., age must be a number, weight must be positive).
   - Provide user feedback on save (success/error messages).

2. **Save Button Logic:**
   - The current example’s Save button does not trigger any action. Implement logic to batch and submit metafield changes only when Save is pressed, rather than on every field change.

3. **Loading & Error States:**
   - Handle loading states for metafields and customer data.
   - Display errors if metafield updates fail.

4. **Multiple Pets Support:**
   - Consider supporting multiple pets per customer using Shopify metaobjects (optional, but future-proof).

5. **Accessibility:**
   - Ensure all form fields and buttons are accessible (labels, ARIA attributes).

6. **Avatar/Image Upload:**
   - If desired, allow customers to upload a pet photo using metaobjects or external storage.

7. **Testing:**
   - Add unit and integration tests for extension logic (if possible).

8. **Localization:**
   - Support multiple languages for field labels and headings, leveraging Shopify’s localization features.

9. **Security:**
   - Ensure only authenticated customers can access and update their own pet profile data.

10. **Code Organization:**
    - Consider splitting the extension UI into smaller components for maintainability.
