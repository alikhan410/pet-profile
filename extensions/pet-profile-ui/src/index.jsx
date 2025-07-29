import {
  reactExtension,
  useApi,
  useSettings,
  BlockStack,
  Card,
  TextBlock,
  Select,
  Button,
  Heading,
  Banner,
} from '@shopify/ui-extensions-react/customer-account';
import { useEffect, useState } from 'react';

export default reactExtension('customer-account.profile.block.render', () => <PetProfile />);

// https://shopify.dev/docs/apps/build/customer-accounts/metafields
// https://shopify.dev/docs/apps/build/customer-accounts/
function PetProfile() {
  const { sessionToken } = useApi();
  const { heading, discount_code } = useSettings();

  const [token, setToken] = useState(null);
  const [fields, setFields] = useState({
    pet_type: '',
    stress_level: '',
    drug_usage: '',
    pet_age: '',
    pet_weight: '',
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [isFirstSubmission, setIsFirstSubmission] = useState(false);
  const [saving, setSaving] = useState(false);

  // Restricted options for validation
  const fieldOptions = {
    pet_age: [
      { label: 'Select Pet Age', value: '' },
      { label: '1-6', value: '1-6' },
      { label: '7-12', value: '7-12' },
      { label: '13-20', value: '13-20' }
    ],
    drug_usage: [
      { label: 'Select Drug Usage', value: '' },
      { label: 'Allergies', value: 'allergies' },
      { label: 'Gut Health and Immune Support', value: 'Gut Health and Immune Support' },
      { label: 'Hip and Joint Health', value: 'Hip and Joint Health' },
      { label: 'Longevity', value: 'Longevity' },
      { label: 'Anxiety', value: 'Anxiety' },
      { label: 'Skin or Paw Irritation', value: 'Skin or Paw Irritation' }
    ],
    pet_type: [
      { label: 'Select Pet Species', value: '' },
      { label: 'Dog', value: 'Dog' },
      { label: 'Cat', value: 'Cat' },
      { label: 'Small Animal', value: 'small animal' }
    ],
    stress_level: [
      { label: 'Select Stress Level', value: '' },
      { label: 'Low Discomfort or Stress', value: 'low discomfort or stress' },
      { label: '2', value: '2' },
      { label: 'Moderate Discomfort or Stress', value: 'moderate discomfort or stress' },
      { label: '4', value: '4' },
      { label: 'Severe Discomfort or Stress', value: 'severe discomfort or stress' }
    ],
    pet_weight: [
      { label: 'Select Pet Weight', value: '' },
      { label: 'Under 20lbs', value: 'under 20lbs' },
      { label: '20-50lbs', value: '20-50lbs' },
      { label: '50+lbs', value: '50+lbs' }
    ]
  };

  // Load metafields via Storefront API
  useEffect(() => {
    async function load() {
      try {
        const tokenValue = await sessionToken.get();
        setToken(tokenValue);

        const response = await fetch("shopify://customer-account/api/2025-07/graphql.json", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `
            query {
              customer {
                id
                pet_type: metafield(namespace: "variables", key: "pet_type") { value }
                stress_level: metafield(namespace: "variables", key: "stress_level") { value }
                drug_usage: metafield(namespace: "variables", key: "drug_usage") { value }
                pet_age: metafield(namespace: "variables", key: "pet_age") { value }
                pet_weight: metafield(namespace: "variables", key: "pet_weight") { value }
                first_submission: metafield(namespace: "variables", key: "first_submission") { value }
              }
            }
          ` })
        });
        const result = await response.json();
        const data = result?.data?.customer;
        if (!data) throw new Error('Customer not found');

        // Check if this is the first submission
        const hasSubmittedBefore = data.first_submission?.value === 'true';
        setIsFirstSubmission(!hasSubmittedBefore);

        // Populate fields state with metafield values (or empty strings if null)
        setFields({
          pet_type: data.pet_type?.value || '',
          stress_level: data.stress_level?.value || '',
          drug_usage: data.drug_usage?.value || '',
          pet_age: data.pet_age?.value || '',
          pet_weight: data.pet_weight?.value || '',
        });
      } catch (err) {
        setStatus({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const validateFields = () => {
    const errors = [];
    
    if (!fields.pet_age) errors.push('Pet Age is required');
    if (!fields.drug_usage) errors.push('Drug Usage is required');
    if (!fields.pet_type) errors.push('Pet Species is required');
    if (!fields.stress_level) errors.push('Stress Level is required');
    if (!fields.pet_weight) errors.push('Pet Weight is required');
    
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateFields();
    
    if (validationErrors.length > 0) {
      setStatus({ type: 'error', message: validationErrors.join(', ') });
      return;
    }

    // Clear any previous status messages and set saving state
    setStatus(null);
    setSaving(true);

    try {
      const response = await fetch("https://pet-profile-ruby.vercel.app/pet-profile", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...fields,
          isFirstSubmission: isFirstSubmission 
        }),
      });
      if (!response.ok) throw new Error('Failed to save data');
      
      // Show appropriate success message based on first submission
      if (isFirstSubmission) {
        const discountCode = discount_code;
        setStatus({ 
          type: 'success', 
          message: `Profile saved successfully! 🎉 Use code: *${discountCode}* to get 20% off!` 
        });
        setIsFirstSubmission(false);
      } else {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <TextBlock>Loading...</TextBlock>;
  }

  return (
    <Card padding>
      <BlockStack spacing="loose">
        {/* 🔸 Use the customizable heading from settings, fallback to default text */}
        <Heading level={3}>{heading || 'Your Pet Profile'}</Heading>

        {status?.type === 'success' && <Banner status="success">{status.message}</Banner>}
        {status?.type === 'error' && <Banner status="critical">{status.message}</Banner>}
        {status?.type === 'info' && <Banner status="info">{status.message}</Banner>}

        <Select
          label="Pet Species"
          options={fieldOptions.pet_type}
          value={fields.pet_type}
          onChange={(val) => handleChange('pet_type', val)}
        />
        
        <Select
          label="Stress Level"
          options={fieldOptions.stress_level}
          value={fields.stress_level}
          onChange={(val) => handleChange('stress_level', val)}
        />
    
        <Select
          label="Drug Usage"
          options={fieldOptions.drug_usage}
          value={fields.drug_usage}
          onChange={(val) => handleChange('drug_usage', val)}
        />
     
        <Select
          label="Pet Age"
          options={fieldOptions.pet_age}
          value={fields.pet_age}
          onChange={(val) => handleChange('pet_age', val)}
        />
      
        <Select
          label="Pet Weight"
          options={fieldOptions.pet_weight}
          value={fields.pet_weight}
          onChange={(val) => handleChange('pet_weight', val)}
        />
   
        <Button onPress={handleSubmit} loading={saving} disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </BlockStack>
    </Card>
  );
}
