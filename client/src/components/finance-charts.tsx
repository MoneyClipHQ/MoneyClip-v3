import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import type { FinanceChart } from '../../../server/openai-service';
import { financeChartData } from '../../../shared/finance-charts';

interface FinanceChartComponentProps {
  chart: FinanceChart;
  height?: number;
}

// Custom tooltip for currency formatting
const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey}: {typeof entry.value === 'number' && entry.value > 1000 
              ? `$${entry.value.toLocaleString()}` 
              : `${entry.value}${entry.dataKey === 'rate' || entry.dataKey === 'performance' ? '%' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for percentage formatting
const PercentageTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Line Chart Component
export function FinanceLineChart({ chart, height = 300 }: FinanceChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={chart.id === 'sp500-performance' ? 'month' : 
                  chart.id === 'bond-yield-curve' ? 'maturity' :
                  chart.id === 'inflation-impact' ? 'year' :
                  chart.id === 'dollar-cost-averaging' ? 'month' : 'year'} 
          stroke="#666"
        />
        <YAxis stroke="#666" />
        <Tooltip content={<CurrencyTooltip />} />
        <Legend />
        
        {chart.id === 'dollar-cost-averaging' ? (
          <>
            <Line 
              type="monotone" 
              dataKey="dca" 
              stroke="#2563eb" 
              strokeWidth={3}
              name="Dollar Cost Averaging"
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="lumpSum" 
              stroke="#dc2626" 
              strokeWidth={3}
              name="Lump Sum Investment"
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
            />
          </>
        ) : (
          <Line 
            type="monotone" 
            dataKey={chart.id === 'sp500-performance' ? 'value' : 
                    chart.id === 'bond-yield-curve' ? 'yield' :
                    chart.id === 'inflation-impact' ? 'purchasingPower' : 'value'} 
            stroke="#2563eb" 
            strokeWidth={3}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
export function FinanceBarChart({ chart, height = 300 }: FinanceChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={chart.id === 'sector-performance' ? 'sector' :
                  chart.id === 'expense-ratio-comparison' ? 'fundType' :
                  chart.id === 'tax-bracket-analysis' ? 'bracket' : 'name'} 
          stroke="#666"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#666" />
        <Tooltip content={chart.id === 'expense-ratio-comparison' ? <PercentageTooltip /> : <CurrencyTooltip />} />
        
        <Bar 
          dataKey={chart.id === 'sector-performance' ? 'performance' :
                  chart.id === 'expense-ratio-comparison' ? 'expenseRatio' :
                  chart.id === 'tax-bracket-analysis' ? 'rate' : 'value'}
          fill="#2563eb"
        >
          {chart.data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color || '#2563eb'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
export function FinancePieChart({ chart, height = 300 }: FinanceChartComponentProps) {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chart.data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chart.data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Area Chart Component
export function FinanceAreaChart({ chart, height = 300 }: FinanceChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={chart.id === 'retirement-savings-growth' ? 'year' : 'assetClass'} 
          stroke="#666"
        />
        <YAxis stroke="#666" />
        <Tooltip content={<CurrencyTooltip />} />
        
        {chart.id === 'retirement-savings-growth' ? (
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ) : (
          <>
            <Area
              type="monotone"
              dataKey="return"
              stackId="1"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stackId="1"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.6}
            />
          </>
        )}
        <Legend />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Main Chart Component that renders the appropriate chart type
export function FinanceChartComponent({ chart, height = 300 }: FinanceChartComponentProps) {
  switch (chart.chartType) {
    case 'line':
      return <FinanceLineChart chart={chart} height={height} />;
    case 'bar':
      return <FinanceBarChart chart={chart} height={height} />;
    case 'pie':
      return <FinancePieChart chart={chart} height={height} />;
    case 'area':
      return <FinanceAreaChart chart={chart} height={height} />;
    default:
      return <FinanceLineChart chart={chart} height={height} />;
  }
}