import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend, // 1. Import Legend
} from "recharts";
import {
  Building,
  BarChart3,
  LineChart as LineChartIcon,
  Building2,
  TrendingUp,
} from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// A color palette for the chart lines
const METRIC_COLORS = ["#4f46e5", "#22c55e", "#f97316"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`Year: ${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const App: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  // 2. State is now an array to hold multiple metrics
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const metrics = ["SALES", "EBITDA", "PAT"];

  useEffect(() => {
    fetch(`${API_URL}/api/companies`)
      .then((res) => res.json())
      .then((data) => setCompanies(data))
      .catch((err) => console.error(err));
  }, []);

  // 3. useEffect updated to handle the selectedMetrics array
  useEffect(() => {
    if (selectedCompany && selectedMetrics.length > 0) {
      setIsLoading(true);

      // Build a URL with multiple 'metric' query parameters
      const params = new URLSearchParams();
      params.append("company", selectedCompany);
      selectedMetrics.forEach((metric) => params.append("metric", metric));

      fetch(`${API_URL}/api/data?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setChartData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setChartData([]); // Clear data if no metrics are selected
    }
  }, [selectedCompany, selectedMetrics]);

  // 4. Handler to add/remove metrics from the state array
  const handleMetricClick = (metric: string) => {
    setSelectedMetrics((prevMetrics) => {
      if (prevMetrics.includes(metric)) {
        return prevMetrics.filter((m) => m !== metric); // Remove metric
      } else {
        return [...prevMetrics, metric]; // Add metric
      }
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Company Financial Dashboard</h1>
        <p>Select a company and one or more metrics to view performance</p>
      </header>

      <div className="content-container">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h2 className="sidebar-title">
              <Building size={18} />
              <span>Company</span>
            </h2>
            <div className="button-group">
              {companies.map((company) => (
                <button
                  key={company}
                  className={`btn ${selectedCompany === company ? "btn-active" : ""
                    }`}
                  onClick={() => setSelectedCompany(company)}
                >
                  <Building2 size={16} />
                  <span>{company}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-title">
              <BarChart3 size={18} />
              <span>Metric</span>
            </h2>
            <div className="button-group">
              {metrics.map((metric) => (
                // 5. Buttons updated to use the new handler and check the array
                <button
                  key={metric}
                  className={`btn ${selectedMetrics.includes(metric) ? "btn-active" : ""
                    }`}
                  onClick={() => handleMetricClick(metric)}
                >
                  <TrendingUp size={16} />
                  <span>{metric}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="chart-section">
          {isLoading ? (
            <div className="spinner-container"><div className="spinner"></div></div>
          ) : chartData.length > 0 ? (
            <div className="chart-card">
              <h2>
                {selectedCompany} — {selectedMetrics.join(", ")}
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    {/* 6. Dynamically create gradients for each metric's color */}
                    {selectedMetrics.map((metric, index) => (
                      <linearGradient
                        key={metric}
                        id={`color-${metric}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={METRIC_COLORS[index % METRIC_COLORS.length]}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={METRIC_COLORS[index % METRIC_COLORS.length]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-US", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value as number)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {/* 7. Dynamically render an Area for each selected metric */}
                  {selectedMetrics.map((metric, index) => (
                    <Area
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={METRIC_COLORS[index % METRIC_COLORS.length]}
                      fill={`url(#color-${metric})`}
                      strokeWidth={2}
                      // Add these two props to show points on the chart
                      dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }} // Style for standard dots
                      activeDot={{ r: 5, strokeWidth: 2 }}         // Style for the dot on hover
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="placeholder">
              <LineChartIcon size={48} color="#9ca3af" />
              <p>Please select a company and at least one metric.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;