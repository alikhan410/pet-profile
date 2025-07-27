import React, { useState, useMemo } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  Select,
  ButtonGroup,
  ProgressBar,
  BlockStack,
  InlineStack,
  InlineGrid,
  Divider,
  Icon,
  Tooltip,
  Banner,
  Spinner,
  Toast,
} from '@shopify/polaris';
import {
  EmailIcon,
  ExportIcon,
  ChartVerticalFilledIcon,
  PersonIcon
} from '@shopify/polaris-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { fetchCustomersWithPagination, calculateDataQuality, generateDimensionData } from '../utils/customerDataUtils';
import '@shopify/polaris/build/esm/styles.css';

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

    const dataQuality = calculateDataQuality(result.customers);

    return { 
      customers: result.customers,
      totalCustomers: result.totalCustomers,
      shop: session.shop,
      error: null,
      dataQuality,
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

const COLORS = ['#00848E', '#FFA500', '#E3002B', '#FFD700', '#9C6ADE', '#50B83C'];

export default function Dashboard() {
  const { customers, totalCustomers, shop, error, dataQuality, paginationInfo } = useLoaderData();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [showToast, setShowToast] = useState(false);

  const periodOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last year', value: '365' }
  ];

  // Show warning if we hit the limit
  React.useEffect(() => {
    if (paginationInfo?.hasMore && paginationInfo?.totalFetched >= paginationInfo?.maxCustomers) {
      setShowToast(true);
    }
  }, [paginationInfo]);

  // Calculate real data from customers
  const customerData = useMemo(() => {
    if (error || customers.length === 0) {
      return {
        totalCustomers: 0,
        verifiedEmails: 0,
        unverifiedEmails: 0,
        missingMetafields: {},
        monthlyTrends: []
      };
    }

    const verifiedEmails = customers.filter(c => c.verifiedEmail).length;
    const unverifiedEmails = totalCustomers - verifiedEmails;
    
    const missingMetafields = {
      pet_type: customers.filter(c => !c.pet_type || c.pet_type.trim() === '').length,
      pet_weight: customers.filter(c => !c.pet_weight || c.pet_weight.trim() === '').length,
      drug_usage: customers.filter(c => !c.drug_usage || c.drug_usage.trim() === '').length,
      stress_level: customers.filter(c => !c.stress_level || c.stress_level.trim() === '').length,
      pet_age: customers.filter(c => !c.pet_age || c.pet_age.trim() === '').length
    };

    // Calculate monthly trends (simplified - using creation dates)
    const now = new Date();
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthCustomers = customers.filter(c => {
        const customerDate = new Date(c.createdAt);
        return customerDate.getMonth() === monthDate.getMonth() && 
               customerDate.getFullYear() === monthDate.getFullYear();
      });
      const verified = monthCustomers.filter(c => c.verifiedEmail).length;
      const unverified = monthCustomers.length - verified;
      monthlyTrends.push({ month: monthName, verified, unverified });
    }

    return {
      totalCustomers,
      verifiedEmails,
      unverifiedEmails,
      missingMetafields,
      monthlyTrends
    };
  }, [customers, totalCustomers, error]);

  // Calculate completion percentages
  const emailVerificationRate = customerData.totalCustomers > 0 
    ? ((customerData.verifiedEmails / customerData.totalCustomers) * 100).toFixed(1)
    : '0.0';

  const overallDataCompleteness = useMemo(() => {
    const totalFields = customerData.totalCustomers * 5; // 5 fields total
    const missingTotal = Object.values(customerData.missingMetafields).reduce((a, b) => a + b, 0) + customerData.unverifiedEmails;
    return totalFields > 0 ? ((totalFields - missingTotal) / totalFields * 100).toFixed(1) : '0.0';
  }, [customerData]);

  // Prepare pie chart data
  const metafieldPieData = Object.entries(customerData.missingMetafields).map(([key, value], index) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: COLORS[index]
  }));

  const [selectedDimension, setSelectedDimension] = useState('pet_age');

  const dimensionOptions = [
    { label: 'Pet Age', value: 'pet_age' },
    { label: 'Drug Usage', value: 'drug_usage' },
    { label: 'Pet Weight', value: 'pet_weight' },
    { label: 'Pet Species', value: 'pet_type' },
    { label: 'Stress Level', value: 'stress_level' }
  ];
  
  // Calculate real dimension data based on actual customer data
  const dimensionData = useMemo(() => {
    return generateDimensionData(customers);
  }, [customers]);
  
  // Show error state if there's an error
  if (error) {
    return (
      <Page title="Customer Data Analytics">
        <Layout>
          <Layout.Section>
            <Banner status="critical" title="Error Loading Data">
              <p>Failed to load customer data: {error}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
      <Page
        title="Customer Data Analytics"
        subtitle="Monitor email verification and pet profile completeness"
        primaryAction={{
          content: 'Export Report',
          icon: ExportIcon,
          onAction: () => {shopify.toast.show('Button does not work right now.',{isError:true})}
        }}
        secondaryActions={[
          {
            content: 'Send Reminders',
            onAction: () => {shopify.toast.show('Button does not work right now.',{isError:true})}
          }
        ]}
      >
        <Layout>
          {/* Data Quality Warning */}
          {showToast && (
            <Layout.Section>
              <Banner
                title="Large Dataset Detected"
                status="warning"
                action={{
                  content: 'View All',
                  onAction: () => setShowToast(false)
                }}
                onDismiss={() => setShowToast(false)}
              >
                <p>
                  Found {paginationInfo?.totalFetched} customers. For better performance with large datasets, 
                  consider implementing server-side pagination or data caching.
                </p>
              </Banner>
            </Layout.Section>
          )}

          {/* Summary Banner */}
          <Layout.Section>
            <Banner
              title="Data Quality Overview"
              status="info"
              action={{
                content: 'View Recommendations',
                onAction: () => console.log('View recommendations')
              }}
            >
              <p>
                Overall data completeness is at {overallDataCompleteness}%. 
                {dataQuality.completeProfiles > 0 && (
                  <span> {dataQuality.completeProfiles} customers have complete profiles.</span>
                )}
                {dataQuality.incompleteProfiles > 0 && (
                  <span> {dataQuality.incompleteProfiles} customers have incomplete data.</span>
                )}
              </p>
            </Banner>
          </Layout.Section>

          {/* Filter Controls */}
          <Layout.Section>
            <Card>
              <div style={{ padding: '16px' }}>
                <BlockStack alignment="center" distribution="equalSpacing">
                  <InlineStack alignment="center">
                    <Text variant="headingMd" as="h3">Time Period:</Text>
                    <div style={{ minWidth: '150px' }}>
                      <Select
                        options={periodOptions}
                        value={selectedPeriod}
                        onChange={setSelectedPeriod}
                      />
                    </div>
                  </InlineStack>
                  <ButtonGroup segmented>
                    <Button pressed>Overview</Button>
                    <Button>Trends</Button>
                    <Button>Details</Button>
                  </ButtonGroup>
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>

          {/* Key Metrics Cards */}
          <Layout.Section>
            <InlineGrid gap="400" columns={3}>
              <Card>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Icon source={PersonIcon} tone="base" />
                  </div>
                  <Text variant="displayMd" as="h2" tone="success">
                    {customerData.totalCustomers.toLocaleString()}
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Total Customers
                  </Text>
                  <div style={{ marginTop: '16px' }}>
                    <Badge tone="success">+12% this month</Badge>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Icon source={EmailIcon} tone="base" />
                  </div>
                  <Text variant="displayMd" as="h2" tone="success">
                    {emailVerificationRate}%
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Email Verification Rate
                  </Text>

                  <div  style={{ marginTop: '16px' }}>
                    <Badge tone="success">{customerData.verifiedEmails.toLocaleString()} verified</Badge>
                    <Badge tone="warning">{customerData.unverifiedEmails} unverified</Badge>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Icon source={ChartVerticalFilledIcon} tone="base" />
                  </div>
                  <Text variant="displayMd" as="h2" tone="warning">
                    {overallDataCompleteness}%
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Data Completeness
                  </Text>
                  <div style={{ marginTop: '16px' }}>
                    <ProgressBar progress={parseFloat(overallDataCompleteness)} size="small" />
                  </div>
                </div>
              </Card>
            </InlineGrid>
          </Layout.Section>

          {/* Dynamic Chart Section */}
          <Layout.Section>
            <Card title="Customer Profile Breakdown">
              <div style={{ padding: '24px' }}>
                {/* Selector Header */}
                <InlineStack
                  alignment="center"
                  spacing="extraLoose"
                  wrap={false}
                  blockAlign="center"
                  style={{ marginBottom: '16px' }}
                >
                  <Text
                    variant="headingMd"
                    as="h3"
                    tone="subdued"
                    style={{ minWidth: '140px' }}
                  >
                    View by Attribute
                  </Text>
                  <div style={{ flex: 1 }}>
                    <ButtonGroup segmented>
                      {dimensionOptions.map(({ label, value }) => (
                        <Button
                          key={value}
                          pressed={selectedDimension === value}
                          onClick={() => setSelectedDimension(value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                </InlineStack>

                {/* Dynamic Chart Section */}
                {(() => {
                  const categories = dimensionData[selectedDimension];
                  const totalCustomers = categories.reduce((sum, d) => sum + d.customers, 0);

                  // Adjust height based on both customer volume and number of categories
                  const getDynamicChartHeight = () => {
                    const baseHeight = 280;
                    const heightByCategoryCount = categories.length * 40;
                    const heightByCustomerVolume = totalCustomers / 20;
                    const buffer = 60; // added buffer to always provide extra room
                    return Math.max(
                      320,
                      Math.min(650, baseHeight + heightByCategoryCount + heightByCustomerVolume + buffer)
                    );
                  };

                  return (
                    <div
                      style={{
                        height: `${getDynamicChartHeight()}px`,
                        paddingLeft: '16px',
                        paddingRight: '16px',
                        paddingBottom: '12px',
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categories}
                          margin={{ top: 20, right: 30, bottom: 40, left: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis 
                            tickFormatter={(value) => Math.round(value)}
                            allowDecimals={false}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="customers"
                            fill="#006fbb"
                            radius={[4, 4, 0, 0]}
                            label={({ x, y, width, value }) => (
                              <text
                                x={x + width / 2}
                                y={y - 8}
                                fill="#000"
                                textAnchor="middle"
                                fontSize={12}
                              >
                                {Math.round(value)} customers
                              </text>
                            )}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            </Card>
          </Layout.Section>

        </Layout>
      </Page>
  );
}
