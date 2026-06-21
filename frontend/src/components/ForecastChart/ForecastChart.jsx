import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Card from '../Card/Card';
import { apiFetch } from '../../services/api';
import './ForecastChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ForecastChart = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiFetch('/agents/forecasts/analytics');
        setAnalyticsData(res);
        if (res && res.length > 0) {
          setSelectedMedicineId(res[0].medicine_id);
        }
      } catch (err) {
        console.error('Failed to load forecast analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <Card className="forecast-chart-container"><p>Loading Demand Analytics...</p></Card>;
  }

  if (analyticsData.length === 0) {
    return (
      <Card className="forecast-chart-container">
        <h3>Demand Forecast Analytics</h3>
        <p>No demand intelligence available.</p>
      </Card>
    );
  }

  const selectedMed = analyticsData.find(m => m.medicine_id === selectedMedicineId) || analyticsData[0];

  const historicalLabels = selectedMed.historical.map(h => h.month);
  const historicalData = selectedMed.historical.map(h => h.demand);

  // Synthesize prediction line (Attach to the last historical point so the line is continuous)
  const futureLabels = ['Next Month', 'In 2 Months', 'In 3 Months'];
  const labels = [...historicalLabels, ...futureLabels];

  // The historical line should map to the historical labels, and null for future labels
  const historicalPlot = [...historicalData, null, null, null];

  // The predicted line should be null for all historical EXCEPT the last one to connect them
  const predictedPlot = Array(historicalLabels.length - 1).fill(null);
  predictedPlot.push(historicalData[historicalData.length - 1]); // Connect to present
  
  if (selectedMed.predicted !== null) {
    predictedPlot.push(selectedMed.predicted);
    predictedPlot.push(selectedMed.predicted * 1.05); // slight synthesized trend for UI
    predictedPlot.push(selectedMed.predicted * 1.10);
  } else {
    predictedPlot.push(null, null, null);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Historical Demand (Actual)',
        data: historicalPlot,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e5',
      },
      {
        label: 'Predicted Demand (AI Agent)',
        data: predictedPlot,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: { family: 'var(--font-primary)' }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: 'var(--font-primary)', size: 14 },
        bodyFont: { family: 'var(--font-primary)', size: 13 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: 'var(--font-primary)' } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'var(--font-primary)' } }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  return (
    <Card className="forecast-chart-container">
      <div className="forecast-chart-header">
        <div>
          <h3 className="forecast-chart-title">Demand Forecast Analytics</h3>
          <p className="forecast-chart-subtitle">Historical trends vs Agent Predictions</p>
        </div>
        <select 
          className="forecast-medicine-select"
          value={selectedMedicineId} 
          onChange={(e) => setSelectedMedicineId(e.target.value)}
        >
          {analyticsData.map(m => (
            <option key={m.medicine_id} value={m.medicine_id}>
              {m.medicine_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ height: '350px', marginTop: '1rem' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {selectedMed.predicted !== null && (
        <div className="forecast-insights-panel">
          <div className="insight-stat">
            <span className="insight-label">30-Day Prediction</span>
            <span className="insight-value">{selectedMed.predicted} units</span>
          </div>
          <div className="insight-stat">
            <span className="insight-label">AI Confidence</span>
            <span className="insight-value highlight">{(selectedMed.confidence_score * 100).toFixed(0)}%</span>
          </div>
          {selectedMed.predicted > 40 && (
             <div className="insight-stat action-required">
               <span className="insight-label">Recommendation</span>
               <span className="insight-value warning">High Demand Expected. Consider Reordering.</span>
             </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ForecastChart;
