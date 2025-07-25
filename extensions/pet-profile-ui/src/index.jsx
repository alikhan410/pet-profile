import {
  reactExtension,
  useApi,
  useSettings,
  BlockStack,
  Card,
  TextBlock,
  TextField,
  Button,
  Heading,
  Banner,
} from '@shopify/ui-extensions-react/customer-account';
import { useEffect, useState } from 'react';

export default reactExtension('customer-account.profile.block.render', () => <PetProfile />);

function PetProfile() {
  const { sessionToken } = useApi();
  const { heading, show_weight, show_drug_usage } = useSettings();

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
              }
            }
          ` })
        });
        const result = await response.json();
        const data = result?.data?.customer;
        if (!data) throw new Error('Customer not found');

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

  const handleSubmit = async () => {
    try {
      const response = await fetch("https://liberia-longitude-graduation-sustained.trycloudflare.com/app-proxy/pet-profile", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...fields }),  // 🔸 Removed hardcoded customerId
      });
      if (!response.ok) throw new Error('Failed to save data');
      setStatus({ type: 'success', message: 'Profile saved' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
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

        <TextField
          label="Pet Type"
          value={fields.pet_type}
          onChange={(val) => handleChange('pet_type', val)}
        />
        <TextField
          label="Stress Level"
          value={fields.stress_level}
          onChange={(val) => handleChange('stress_level', val)}
        />
        {show_drug_usage && (
          <TextField
            label="Drug Usage"
            value={fields.drug_usage}
            onChange={(val) => handleChange('drug_usage', val)}
          />
        )}
        <TextField
          label="Pet Age"
          value={fields.pet_age}
          onChange={(val) => handleChange('pet_age', val)}
        />
        {show_weight && (
          <TextField
            label="Pet Weight"
            value={fields.pet_weight}
            onChange={(val) => handleChange('pet_weight', val)}
          />
        )}
        <Button onPress={handleSubmit}>Save</Button>
      </BlockStack>
    </Card>
  );
}



// import {
//   reactExtension,
//   useApi,
//   useSettings,
//   BlockStack,
//   Card,
//   TextBlock,
//   TextField,
//   Button,
//   Heading,
//   Banner,
// } from '@shopify/ui-extensions-react/customer-account';
// import { useEffect, useState } from 'react';

// export default reactExtension('customer-account.profile.block.render', () => <PetProfile />);

// function PetProfile() {
//   // const { query } = useApi();
//   const { heading, show_weight, show_drug_usage } = useSettings();

//   const [fields, setFields] = useState({
//     pet_type: '',
//     stress_level: '',
//     drug_usage: '',
//     pet_age: '',
//     pet_weight: '',
//   });
//   const [loading, setLoading] = useState(true);
//   const [status, setStatus] = useState(null);

//   // Load metafields via Storefront API
//   useEffect(() => {
//     async function load() {
//       try {
//         const response = await fetch("shopify://customer-account/api/2025-07/graphql.json", {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ query: `
//             query {
//               customer {
//                 pet_type: metafield(namespace: "variables", key: "pet_type") { value }
//                 stress_level: metafield(namespace: "variables", key: "stress_level") { value }
//                 drug_usage: metafield(namespace: "variables", key: "drug_usage") { value }
//                 pet_age: metafield(namespace: "variables", key: "pet_age") { value }
//                 pet_weight: metafield(namespace: "variables", key: "pet_weight") { value }
//               }
//             }
//           ` })
//         });
//         const result = await response.json();
//         console.log(result);

//         const data = result?.data?.customer;
//         if (!data) throw new Error('Customer not found');

//         setFields({
//           pet_type: data.pet_type?.value || '',
//           stress_level: data.stress_level?.value || '',
//           drug_usage: data.drug_usage?.value || '',
//           pet_age: data.pet_age?.value || '',
//           pet_weight: data.pet_weight?.value || '',
//         });
//       } catch (err) {
//         setStatus({ type: 'error', message: err.message });
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, []);

//   const handleChange = (key, value) => {
//     setFields(prev => ({ ...prev, [key]: value }));
//     setStatus(null);
//   };

//   const handleSubmit = async () => {
//     try {
//       const response = await fetch('/api/update-pet-profile', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(fields),
//       });

//       if (!response.ok) throw new Error('Failed to save data');
//       setStatus({ type: 'success', message: 'Profile saved' });
//     } catch (err) {
//       setStatus({ type: 'error', message: err.message });
//     }
//   };

//   if (loading) return <TextBlock>Loading...</TextBlock>;

//   return (
//     <Card>
//       <BlockStack spacing="loose">
//         {heading && <Heading>{heading}</Heading>}
//         {status?.type === 'success' && <Banner status="success">{status.message}</Banner>}
//         {status?.type === 'error' && <Banner status="critical">{status.message}</Banner>}

//         <TextField label="Pet Type" value={fields.pet_type} onChange={val => handleChange('pet_type', val)} />
//         <TextField label="Stress Level" value={fields.stress_level} onChange={val => handleChange('stress_level', val)} />
//         {show_drug_usage && (
//           <TextField label="Drug Usage" value={fields.drug_usage} onChange={val => handleChange('drug_usage', val)} />
//         )}
//         <TextField label="Pet Age" value={fields.pet_age} onChange={val => handleChange('pet_age', val)} />
//         {show_weight && (
//           <TextField label="Pet Weight" value={fields.pet_weight} onChange={val => handleChange('pet_weight', val)} />
//         )}

//         <Button onPress={handleSubmit}>Save</Button>
//       </BlockStack>
//     </Card>
//   );
// }
// function PetProfile() {
//   const { query } = useApi();
//   const { heading, show_weight, show_drug_usage } = useSettings();

//   const [fields, setFields] = useState({
//     pet_type: '',
//     stress_level: '',
//     drug_usage: '',
//     pet_age: '',
//     pet_weight: '',
//   });
//   const [loading, setLoading] = useState(true);
//   const [status, setStatus] = useState(null);

//   // Load metafields via Storefront API
//   useEffect(() => {
//     async function load() {
//       try {
//         const result = await query(`query {
//           customer {
//             pet_type: metafield(namespace: "variables", key: "pet_type") { value }
//             stress_level: metafield(namespace: "variables", key: "stress_level") { value }
//             drug_usage: metafield(namespace: "variables", key: "drug_usage") { value }
//             pet_age: metafield(namespace: "variables", key: "pet_age") { value }
//             pet_weight: metafield(namespace: "variables", key: "pet_weight") { value }
//           }
//         }`);

//         const data = result?.data?.customer;
//         if (!data) throw new Error('Customer not found');

//         setFields({
//           pet_type: data.pet_type?.value || '',
//           stress_level: data.stress_level?.value || '',
//           drug_usage: data.drug_usage?.value || '',
//           pet_age: data.pet_age?.value || '',
//           pet_weight: data.pet_weight?.value || '',
//         });
//       } catch (err) {
//         setStatus({ type: 'error', message: err.message });
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//   }, []);

//   const handleChange = (key, value) => {
//     setFields(prev => ({ ...prev, [key]: value }));
//     setStatus(null);
//   };

//   const handleSubmit = async () => {
//     try {
//       const response = await fetch('/api/update-pet-profile', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(fields),
//       });

//       if (!response.ok) throw new Error('Failed to save data');
//       setStatus({ type: 'success', message: 'Profile saved' });
//     } catch (err) {
//       setStatus({ type: 'error', message: err.message });
//     }
//   };

//   if (loading) return <TextBlock>Loading...</TextBlock>;

//   return (
//     <Card>
//       <BlockStack spacing="loose">
//         {heading && <Heading>{heading}</Heading>}
//         {status?.type === 'success' && <Banner status="success">{status.message}</Banner>}
//         {status?.type === 'error' && <Banner status="critical">{status.message}</Banner>}

//         <TextField label="Pet Type" value={fields.pet_type} onChange={val => handleChange('pet_type', val)} />
//         <TextField label="Stress Level" value={fields.stress_level} onChange={val => handleChange('stress_level', val)} />
//         {show_drug_usage && (
//           <TextField label="Drug Usage" value={fields.drug_usage} onChange={val => handleChange('drug_usage', val)} />
//         )}
//         <TextField label="Pet Age" value={fields.pet_age} onChange={val => handleChange('pet_age', val)} />
//         {show_weight && (
//           <TextField label="Pet Weight" value={fields.pet_weight} onChange={val => handleChange('pet_weight', val)} />
//         )}

//         <Button onPress={handleSubmit}>Save</Button>
//       </BlockStack>
//     </Card>
//   );
// }
