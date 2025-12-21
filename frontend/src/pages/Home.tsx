import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getIssueStatistics } from '../services/api';
import { statusColors } from '../styles/colors';
import './Home.scss';

const Home: React.FC = () => {
  const [chartData, setChartData] = useState<Array<{
    severity: string;
    open: number;
    in_progress: number;
    resolved: number;
    total: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const stats = await getIssueStatistics();

        // Transform to array format for chart
        const chartDataArray = Object.entries(stats).map(([severity, counts]) => ({
          severity: severity.charAt(0).toUpperCase() + severity.slice(1),
          open: counts.open,
          in_progress: counts.in_progress,
          resolved: counts.resolved,
          total: counts.open + counts.in_progress + counts.resolved,
        }));

        setChartData(chartDataArray);
      } catch (error) {
        console.error('Failed to fetch issue statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Use colors from the color scheme
  const colors = {
    open: statusColors.open,
    in_progress: statusColors.inProgress,
    resolved: statusColors.resolved,
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{payload[0].payload.severity} Severity</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {entry.name === 'in_progress' ? 'In Progress' : entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: {entry.value}
            </p>
          ))}
          <p className="tooltip-total">Total: {payload[0].payload.total}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="home-page">
        <h1>Issue Statistics</h1>
        <p>Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <h1>Dashboard</h1>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="severity" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => {
                if (value === 'in_progress') return 'In Progress';
                return value.charAt(0).toUpperCase() + value.slice(1);
              }}
            />
            <Bar dataKey="open" stackId="a" fill={colors.open} name="Open" />
            <Bar dataKey="in_progress" stackId="a" fill={colors.in_progress} name="In Progress" />
            <Bar dataKey="resolved" stackId="a" fill={colors.resolved} name="Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Home;
