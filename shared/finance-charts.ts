import type { FinanceChart } from "../server/openai-service";

// Finance chart data for different topics with realistic data
export const financeChartData: FinanceChart[] = [
  {
    id: "portfolio-allocation",
    title: "Diversified Portfolio Allocation",
    category: "Portfolio Management",
    chartType: "pie",
    description: "Recommended asset allocation for balanced growth and risk management",
    data: [
      { name: "US Stocks", value: 35, color: "#2563eb" },
      { name: "International Stocks", value: 20, color: "#7c3aed" },
      { name: "Bonds", value: 25, color: "#059669" },
      { name: "Real Estate", value: 10, color: "#dc2626" },
      { name: "Cash/Emergency", value: 10, color: "#f59e0b" }
    ]
  },
  {
    id: "sp500-performance",
    title: "S&P 500 Performance (12 Months)",
    category: "Market Analysis",
    chartType: "line",
    description: "Year-over-year S&P 500 index performance showing market trends",
    data: [
      { month: "Jan", value: 4200, date: "2024-01" },
      { month: "Feb", value: 4150, date: "2024-02" },
      { month: "Mar", value: 4300, date: "2024-03" },
      { month: "Apr", value: 4450, date: "2024-04" },
      { month: "May", value: 4380, date: "2024-05" },
      { month: "Jun", value: 4500, date: "2024-06" },
      { month: "Jul", value: 4420, date: "2024-07" },
      { month: "Aug", value: 4580, date: "2024-08" },
      { month: "Sep", value: 4520, date: "2024-09" },
      { month: "Oct", value: 4650, date: "2024-10" },
      { month: "Nov", value: 4720, date: "2024-11" },
      { month: "Dec", value: 4780, date: "2024-12" }
    ]
  },
  {
    id: "retirement-savings-growth",
    title: "Retirement Savings Growth Projection",
    category: "Retirement Planning",
    chartType: "area",
    description: "30-year projection of retirement savings with compound interest",
    data: [
      { year: 2025, age: 35, balance: 50000 },
      { year: 2030, age: 40, balance: 125000 },
      { year: 2035, age: 45, balance: 250000 },
      { year: 2040, age: 50, balance: 420000 },
      { year: 2045, age: 55, balance: 680000 },
      { year: 2050, age: 60, balance: 1050000 },
      { year: 2055, age: 65, balance: 1580000 }
    ]
  },
  {
    id: "sector-performance",
    title: "Sector Performance Comparison (YTD)",
    category: "Market Analysis",
    chartType: "bar",
    description: "Year-to-date performance across major market sectors",
    data: [
      { sector: "Technology", performance: 12.5, color: "#2563eb" },
      { sector: "Healthcare", performance: 8.2, color: "#059669" },
      { sector: "Finance", performance: 6.8, color: "#7c3aed" },
      { sector: "Energy", performance: -2.1, color: "#dc2626" },
      { sector: "Utilities", performance: 4.3, color: "#f59e0b" },
      { sector: "Consumer Goods", performance: 9.7, color: "#06b6d4" },
      { sector: "Real Estate", performance: 5.9, color: "#84cc16" }
    ]
  },
  {
    id: "bond-yield-curve",
    title: "US Treasury Yield Curve",
    category: "Fixed Income",
    chartType: "line",
    description: "Current Treasury bond yields across different maturities",
    data: [
      { maturity: "3M", yield: 4.2, months: 3 },
      { maturity: "6M", yield: 4.5, months: 6 },
      { maturity: "1Y", yield: 4.8, months: 12 },
      { maturity: "2Y", yield: 4.9, months: 24 },
      { maturity: "5Y", yield: 4.7, months: 60 },
      { maturity: "10Y", yield: 4.5, months: 120 },
      { maturity: "30Y", yield: 4.3, months: 360 }
    ]
  },
  {
    id: "expense-ratio-comparison",
    title: "Investment Fund Expense Ratios",
    category: "Investment Analysis",
    chartType: "bar",
    description: "Annual expense ratios for different types of investment funds",
    data: [
      { fundType: "Index Funds", expenseRatio: 0.05, color: "#059669" },
      { fundType: "ETFs", expenseRatio: 0.12, color: "#2563eb" },
      { fundType: "Mutual Funds", expenseRatio: 0.68, color: "#f59e0b" },
      { fundType: "Active Funds", expenseRatio: 1.25, color: "#dc2626" },
      { fundType: "Hedge Funds", expenseRatio: 2.15, color: "#7c3aed" }
    ]
  },
  {
    id: "inflation-impact",
    title: "Inflation Impact on $100k Over Time",
    category: "Economic Analysis",
    chartType: "line",
    description: "Purchasing power of $100,000 over 20 years with 3% inflation",
    data: [
      { year: 2024, purchasingPower: 100000, inflationRate: 3.0 },
      { year: 2029, purchasingPower: 86261, inflationRate: 3.0 },
      { year: 2034, purchasingPower: 74409, inflationRate: 3.0 },
      { year: 2039, purchasingPower: 64186, inflationRate: 3.0 },
      { year: 2044, purchasingPower: 55368, inflationRate: 3.0 }
    ]
  },
  {
    id: "risk-return-scatter",
    title: "Risk vs Return Analysis",
    category: "Risk Management",
    chartType: "area",
    description: "Risk-return profile of different asset classes over 10 years",
    data: [
      { assetClass: "Treasury Bonds", risk: 2.1, return: 3.2, volatility: "Low" },
      { assetClass: "Corporate Bonds", risk: 4.5, return: 4.8, volatility: "Low-Med" },
      { assetClass: "Dividend Stocks", risk: 12.3, return: 8.5, volatility: "Medium" },
      { assetClass: "Growth Stocks", risk: 18.7, return: 11.2, volatility: "High" },
      { assetClass: "International Stocks", risk: 16.2, return: 9.8, volatility: "Med-High" },
      { assetClass: "REITs", risk: 14.8, return: 7.9, volatility: "Medium" }
    ]
  },
  {
    id: "tax-bracket-analysis",
    title: "2024 Federal Tax Brackets",
    category: "Tax Planning",
    chartType: "bar",
    description: "Federal income tax rates by income bracket for single filers",
    data: [
      { bracket: "$0-$11,000", rate: 10, minIncome: 0, maxIncome: 11000, color: "#84cc16" },
      { bracket: "$11k-$44k", rate: 12, minIncome: 11000, maxIncome: 44725, color: "#06b6d4" },
      { bracket: "$44k-$95k", rate: 22, minIncome: 44725, maxIncome: 95375, color: "#f59e0b" },
      { bracket: "$95k-$182k", rate: 24, minIncome: 95375, maxIncome: 182050, color: "#7c3aed" },
      { bracket: "$182k-$231k", rate: 32, minIncome: 182050, maxIncome: 231250, color: "#dc2626" },
      { bracket: "$231k+", rate: 37, minIncome: 231250, maxIncome: 999999, color: "#991b1b" }
    ]
  },
  {
    id: "dollar-cost-averaging",
    title: "Dollar Cost Averaging vs Lump Sum",
    category: "Investment Strategies",
    chartType: "line",
    description: "Comparison of investment strategies over 12 months in volatile market",
    data: [
      { month: 1, dca: 1000, lumpSum: 10000, marketValue: 10000 },
      { month: 2, dca: 2050, lumpSum: 10500, marketValue: 10500 },
      { month: 3, dca: 2950, lumpSum: 9500, marketValue: 9500 },
      { month: 4, dca: 3900, lumpSum: 9800, marketValue: 9800 },
      { month: 5, dca: 4800, lumpSum: 9200, marketValue: 9200 },
      { month: 6, dca: 5750, lumpSum: 9750, marketValue: 9750 },
      { month: 7, dca: 6650, lumpSum: 9500, marketValue: 9500 },
      { month: 8, dca: 7600, lumpSum: 10300, marketValue: 10300 },
      { month: 9, dca: 8500, lumpSum: 9800, marketValue: 9800 },
      { month: 10, dca: 9450, lumpSum: 10500, marketValue: 10500 },
      { month: 11, dca: 10350, lumpSum: 10200, marketValue: 10200 },
      { month: 12, dca: 11300, lumpSum: 11200, marketValue: 11200 }
    ]
  }
];

// Categories for filtering
export const chartCategories = [
  "Portfolio Management",
  "Market Analysis", 
  "Retirement Planning",
  "Fixed Income",
  "Investment Analysis",
  "Economic Analysis",
  "Risk Management",
  "Tax Planning",
  "Investment Strategies"
];

// Chart type configurations
export const chartTypeConfig = {
  line: {
    name: "Line Chart",
    description: "Best for showing trends over time",
    icon: "📈"
  },
  bar: {
    name: "Bar Chart", 
    description: "Perfect for comparing values across categories",
    icon: "📊"
  },
  pie: {
    name: "Pie Chart",
    description: "Ideal for showing proportions and allocations",
    icon: "🥧"
  },
  area: {
    name: "Area Chart",
    description: "Great for visualizing cumulative data over time",
    icon: "📊"
  }
};