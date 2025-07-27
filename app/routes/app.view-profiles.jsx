import {
  Page,
  Card,
  IndexTable,
  Text,
  Link,
  useIndexResourceState,
  Filters,
  TextField,
  Spinner,
  ChoiceList,
  Checkbox,
  Box,
  Button,
  Pagination,
  Divider,
  Banner,
  Badge,
  EmptyState,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { authenticate } from "../shopify.server";
import { fetchCustomersWithPagination, getProfileCompleteness } from "../utils/customerDataUtils";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  try {
    const result = await fetchCustomersWithPagination(admin, 1000, 100);
    
    if (result.error) {
      return { 
        customers: [],
        totalCustomers: 0,
        shop: session.shop,
        error: result.error,
        dataQuality: {
          completeProfiles: 0,
          incompleteProfiles: 0,
          missingData: {}
        }
      };
    }

    return { 
      customers: result.customers,
      totalCustomers: result.totalCustomers,
      shop: session.shop,
      error: null,
      paginationInfo: result.paginationInfo
    };

  } catch (error) {
    console.error('Error fetching customer data:', error);
    
    return { 
      customers: [],
      totalCustomers: 0,
      shop: session.shop,
      error: error.message,
      dataQuality: {
        completeProfiles: 0,
        incompleteProfiles: 0,
        missingData: {}
      }
    };
  }
};

export default function CustomerProfilesPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const itemsPerPage = 50;

  const { customers: allCustomers, totalCustomers, shop, error, paginationInfo } = useLoaderData();
  const [filteredCustomers, setFilteredCustomers] = useState(allCustomers);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [currentPage, filteredCustomers]);

  // 1. Mount check
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update filtered customers when allCustomers changes
  useEffect(() => {
    setFilteredCustomers(allCustomers);
  }, [allCustomers]);

  const [queryValue, setQueryValue] = useState("");
  const [petTypeFilter, setPetTypeFilter] = useState([]);
  const [stressLevelFilter, setStressLevelFilter] = useState([]);
  const [hasPetType, setHasPetType] = useState(false);
  const [hasStressLevel, setHasStressLevel] = useState(false);
  const [hasDrugUsage, setHasDrugUsage] = useState(false);
  const [hasPetAge, setHasPetAge] = useState(false);
  const [hasPetWeight, setHasPetWeight] = useState(false);

  // Callbacks
  const handleQueryChange = useCallback((value) => setQueryValue(value), []);
  const handlePetTypeChange = useCallback((value) => setPetTypeFilter(value), []);
  const handleStressLevelChange = useCallback((value) => setStressLevelFilter(value), []);

  const handleQueryValueRemove = () => setQueryValue("");
  const handlePetTypeFilterRemove = () => setPetTypeFilter([]);
  const handleStressLevelFilterRemove = () => setStressLevelFilter([]);
  const handleHasPetTypeRemove = () => setHasPetType(false);
  const handleHasStressLevelRemove = () => setHasStressLevel(false);
  const handleHasDrugUsageRemove = () => setHasDrugUsage(false);
  const handleHasPetAgeRemove = () => setHasPetAge(false);
  const handleHasPetWeightRemove = () => setHasPetWeight(false);

  const handleHasPetTypeChange = useCallback(
    (checked) => setHasPetType(checked),
    [],
  );
  const handleHasStressLevelChange = useCallback(
    (checked) => setHasStressLevel(checked),
    [],
  );
  const handleHasDrugUsageChange = useCallback(
    (checked) => setHasDrugUsage(checked),
    [],
  );
  const handleHasPetAgeChange = useCallback(
    (checked) => setHasPetAge(checked),
    [],
  );
  const handleHasPetWeightChange = useCallback(
    (checked) => setHasPetWeight(checked),
    [],
  );

  const handleClearAll = useCallback(() => {
    setQueryValue("");
    setPetTypeFilter([]);
    setStressLevelFilter([]);
    setHasPetType(false);
    setHasStressLevel(false);
    setHasDrugUsage(false);
    setHasPetAge(false);
    setHasPetWeight(false);
    setFilteredCustomers(allCustomers);
    setCurrentPage(1);
  }, [allCustomers]);

  const appliedFilters = [];
  if (queryValue) {
    appliedFilters.push({
      key: "query",
      label: `Search: ${queryValue}`,
      onRemove: handleQueryValueRemove,
    });
  }
  if (petTypeFilter.length > 0) {
    appliedFilters.push({
      key: "petType",
      label: `Pet Type: ${petTypeFilter.join(", ")}`,
      onRemove: handlePetTypeFilterRemove,
    });
  }
  if (stressLevelFilter.length > 0) {
    appliedFilters.push({
      key: "stressLevel",
      label: `Stress Level: ${stressLevelFilter.join(", ")}`,
      onRemove: handleStressLevelFilterRemove,
    });
  }
  if (hasPetType) {
    appliedFilters.push({
      key: "hasPetType",
      label: "Has Pet Type",
      onRemove: handleHasPetTypeRemove,
    });
  }
  if (hasStressLevel) {
    appliedFilters.push({
      key: "hasStressLevel",
      label: "Has Stress Level",
      onRemove: handleHasStressLevelRemove,
    });
  }
  if (hasDrugUsage) {
    appliedFilters.push({
      key: "hasDrugUsage",
      label: "Has Drug Usage",
      onRemove: handleHasDrugUsageRemove,
    });
  }
  if (hasPetAge) {
    appliedFilters.push({
      key: "hasPetAge",
      label: "Has Pet Age",
      onRemove: handleHasPetAgeRemove,
    });
  }
  if (hasPetWeight) {
    appliedFilters.push({
      key: "hasPetWeight",
      label: "Has Pet Weight",
      onRemove: handleHasPetWeightRemove,
    });
  }

  const filters = [
    {
      key: "query",
      label: "Search",
      filter: (
        <TextField
          label="Search customers"
          value={queryValue}
          onChange={handleQueryChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: "petType",
      label: "Pet Type",
      filter: (
        <ChoiceList
          title="Pet Type"
          titleHidden
          choices={[
            { label: "Dog", value: "Dog" },
            { label: "Cat", value: "Cat" },
            { label: "Bird", value: "Bird" },
            { label: "Fish", value: "Fish" },
            { label: "Other", value: "Other" },
          ]}
          selected={petTypeFilter}
          onChange={handlePetTypeChange}
          allowMultiple
        />
      ),
    },
    {
      key: "stressLevel",
      label: "Stress Level",
      filter: (
        <ChoiceList
          title="Stress Level"
          titleHidden
          choices={[
            { label: "Low", value: "Low" },
            { label: "Medium", value: "Medium" },
            { label: "High", value: "High" },
          ]}
          selected={stressLevelFilter}
          onChange={handleStressLevelChange}
          allowMultiple
        />
      ),
    },
    {
      key: "hasPetType",
      label: "Has Pet Type",
      filter: (
        <Checkbox
          label="Has Pet Type"
          checked={hasPetType}
          onChange={handleHasPetTypeChange}
        />
      ),
    },
    {
      key: "hasStressLevel",
      label: "Has Stress Level",
      filter: (
        <Checkbox
          label="Has Stress Level"
          checked={hasStressLevel}
          onChange={handleHasStressLevelChange}
        />
      ),
    },
    {
      key: "hasDrugUsage",
      label: "Has Drug Usage",
      filter: (
        <Checkbox
          label="Has Drug Usage"
          checked={hasDrugUsage}
          onChange={handleHasDrugUsageChange}
        />
      ),
    },
    {
      key: "hasPetAge",
      label: "Has Pet Age",
      filter: (
        <Checkbox
          label="Has Pet Age"
          checked={hasPetAge}
          onChange={handleHasPetAgeChange}
        />
      ),
    },
    {
      key: "hasPetWeight",
      label: "Has Pet Weight",
      filter: (
        <Checkbox
          label="Has Pet Weight"
          checked={hasPetWeight}
          onChange={handleHasPetWeightChange}
        />
      ),
    },
  ];

  // Apply filters
  useEffect(() => {
    let filtered = allCustomers;

    // Text search
    if (queryValue) {
      const searchTerm = queryValue.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.firstName?.toLowerCase().includes(searchTerm) ||
        customer.lastName?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Pet type filter
    if (petTypeFilter.length > 0) {
      filtered = filtered.filter(customer => 
        petTypeFilter.includes(customer.pet_type)
      );
    }

    // Stress level filter
    if (stressLevelFilter.length > 0) {
      filtered = filtered.filter(customer => 
        stressLevelFilter.includes(customer.stress_level)
      );
    }

    // Has metafield filters
    if (hasPetType) {
      filtered = filtered.filter(customer => customer.pet_type && customer.pet_type.trim() !== '');
    }
    if (hasStressLevel) {
      filtered = filtered.filter(customer => customer.stress_level && customer.stress_level.trim() !== '');
    }
    if (hasDrugUsage) {
      filtered = filtered.filter(customer => customer.drug_usage && customer.drug_usage.trim() !== '');
    }
    if (hasPetAge) {
      filtered = filtered.filter(customer => customer.pet_age && customer.pet_age.trim() !== '');
    }
    if (hasPetWeight) {
      filtered = filtered.filter(customer => customer.pet_weight && customer.pet_weight.trim() !== '');
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [queryValue, petTypeFilter, stressLevelFilter, hasPetType, hasStressLevel, hasDrugUsage, hasPetAge, hasPetWeight, allCustomers]);

  const resourceName = {
    singular: "customer",
    plural: "customers",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredCustomers);

  const handleCustomerClick = (customerId) => {
    const shopDomain = shop.replace('.myshopify.com', '');
    const customerUrl = `https://admin.shopify.com/store/${shopDomain}/customers/${customerId}`;
    window.open(customerUrl, '_blank');
  };

  const rowMarkup = paginatedCustomers.map((customer, index) => {
    const completeness = getProfileCompleteness(customer);
    const completenessColor = completeness === 100 ? 'success' : completeness >= 60 ? 'warning' : 'critical';
    
    return (
      <IndexTable.Row
        id={customer.id}
        key={customer.id}
        position={index}
        selected={selectedResources.includes(customer.id)}
        onClick={() => handleCustomerClick(customer.id)}
      >
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" fontWeight="bold">
            {customer.firstName} {customer.lastName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.verifiedEmail ? "Yes" : "No"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.pet_type || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.stress_level || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.drug_usage || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.pet_age || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text>
            {customer.pet_weight || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={completenessColor}>
            {completeness}% Complete
          </Badge>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  if (!isMounted) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spinner accessibilityLabel="Loading customers..." size="large" />
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Page title="Customer Profiles">
        <Banner status="critical" title="Error Loading Data">
          <p>Failed to load customer data: {error}</p>
        </Banner>
      </Page>
    );
  }

  // Show empty state if no customers
  if (totalCustomers === 0) {
    return (
      <Page title="Customer Profiles">
        <EmptyState
          heading="No customer profiles found"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>No customers have been found with pet profile data.</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page
      title="Customer Profiles"
      subtitle="View customer pet profile data"
    >
      {/* Data Quality Summary */}
      {paginationInfo && (
        <Banner
          title="Data Quality Summary"
          status="info"
        >
          <p>
            Showing {paginationInfo.totalFetched} customers. 
            {paginationInfo.hasMore && (
              <span> More customers available (limited to {paginationInfo.maxCustomers} for performance).</span>
            )}
          </p>
        </Banner>
      )}

      <Card>
        <Filters
          queryValue={queryValue}
          filters={filters}
          appliedFilters={appliedFilters}
          onQueryChange={handleQueryChange}
          onQueryClear={() => setQueryValue("")}
          onClearAll={handleClearAll}
        />
        
        <IndexTable
          resourceName={resourceName}
          itemCount={filteredCustomers.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Customer Name" },
            { title: "Has Account" },
            { title: "Pet Type" },
            { title: "Stress Level" },
            { title: "Drug Usage" },
            { title: "Pet Age" },
            { title: "Pet Weight" },
            { title: "Profile Completeness" },
          ]}
          selectable
        >
          {rowMarkup}
        </IndexTable>
        <Divider />
        <div style={{ paddingTop: "10px" }}>
          <Pagination
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() =>
              setCurrentPage((prev) =>
                prev < Math.ceil(filteredCustomers.length / itemsPerPage)
                  ? prev + 1
                  : prev,
              )
            }
            type="page"
            hasPrevious={currentPage > 1}
            hasNext={
              filteredCustomers.length > 0 &&
              currentPage < Math.ceil(filteredCustomers.length / itemsPerPage)
            }
            label={`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of ${filteredCustomers.length} customers`}
          />
        </div>
      </Card>
    </Page>
  );
} 