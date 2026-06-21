import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader/PageHeader';
import StatCard from '../../components/StatCard/StatCard';
import Card from '../../components/Card/Card';
import Table from '../../components/Table/Table';
import Badge from '../../components/Badge/Badge';
import { Package, AlertTriangle, Clock, ShieldAlert, DollarSign, Activity } from 'lucide-react';
import { medicineService } from '../../services/medicineService';
import { inventoryService } from '../../services/inventoryService';
import { alertService } from '../../services/alertService';
import { agentService } from '../../services/agentService';
import Button from '../../components/Button/Button';
import ForecastChart from '../../components/ForecastChart/ForecastChart';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    nearExpiry: 0,
    quarantined: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const results = await Promise.allSettled([
          medicineService.getMedicines(),
          inventoryService.getLowStock(),
          inventoryService.getOutOfStock(),
          inventoryService.getQuarantine(),
          alertService.getAlerts(),
          agentService.getDecisions(),
          agentService.getDemandForecasts()
        ]);

        const medicines = results[0].status === 'fulfilled' ? results[0].value : [];
        const lowStock = results[1].status === 'fulfilled' ? results[1].value : [];
        const outOfStock = results[2].status === 'fulfilled' ? results[2].value : [];
        const quarantine = results[3].status === 'fulfilled' ? results[3].value : [];
        const alerts = results[4].status === 'fulfilled' ? results[4].value : [];
        const decisionsData = results[5].status === 'fulfilled' ? results[5].value : [];
        const forecastsData = results[6].status === 'fulfilled' ? results[6].value : [];

        const nearExpiryCount = medicines.filter(m => m.status === 'NEAR_EXPIRY').length;

        setStats({
          total: medicines.length,
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          nearExpiry: nearExpiryCount,
          quarantined: quarantine.length,
        });

        setRecentAlerts(alerts.slice(0, 5));
        setDecisions(decisionsData.slice(0, 5));
        setForecasts(forecastsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const columns = [
    { header: 'Type', accessor: 'category', cell: (row) => <Badge variant={row.category === 'Stock' ? 'warning' : 'primary'}>{row.category}</Badge> },
    { header: 'Message', accessor: 'message' },
    { header: 'Time', cell: (row) => new Date(row.created_at).toLocaleString() },
  ];

  const handleApproveDecision = async (id) => {
    try {
      await agentService.approveDecision(id);
      setDecisions(prev => prev.map(d => d.id === id ? { ...d, approval_status: 'APPROVED' } : d));
    } catch (err) {
      console.error('Failed to approve decision', err);
      alert('Failed to approve decision');
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your pharmacy operations and inventory health."
      />

      <div className="stats-grid">
        <StatCard title="Total Medicines" value={stats.total} icon={Package} />
        <StatCard title="Low / Out of Stock" value={stats.lowStock + stats.outOfStock} icon={AlertTriangle} className="text-warning" />
        <StatCard title="Near Expiry" value={stats.nearExpiry} icon={Clock} />
        <StatCard title="Quarantined" value={stats.quarantined} icon={ShieldAlert} />
        <StatCard title="Monthly Revenue" value="-" icon={DollarSign} trendLabel="Data not available yet" />
        <StatCard title="Health Score" value="Good" icon={Activity} />
      </div>

      <div className="dashboard-content-grid">
        <Card title="Procurement Agent Decisions" className="chart-card" style={{ overflow: 'auto' }}>
          {decisions.length === 0 ? (
            <div className="placeholder-chart" style={{ border: 'none', background: 'transparent' }}>
              <span>No pending procurement decisions.</span>
            </div>
          ) : (
            <Table 
              columns={[
                { header: 'Agent', accessor: 'agent_name' },
                { 
                  header: 'Recommendation', 
                  cell: (row) => {
                    try {
                      return JSON.parse(row.recommendation).message;
                    } catch(e) {
                      return row.recommendation;
                    }
                  } 
                },
                { 
                  header: 'Status', 
                  cell: (row) => <Badge variant={row.approval_status === 'APPROVED' ? 'success' : 'warning'}>{row.approval_status}</Badge> 
                },
                { 
                  header: 'Action', 
                  cell: (row) => (
                    row.approval_status === 'PENDING' ? (
                      <Button size="sm" variant="primary" onClick={() => handleApproveDecision(row.id)}>Approve</Button>
                    ) : null
                  )
                }
              ]} 
              data={decisions} 
            />
          )}
        </Card>
        
        <Card title="Recent System Alerts">
          <Table columns={columns} data={recentAlerts} />
        </Card>
      </div>

      <div className="dashboard-content-grid" style={{ marginTop: '20px' }}>
        <Card title="Demand Forecasts (Next 30 Days)" className="chart-card">
          {forecasts.length === 0 ? (
            <div className="placeholder-chart" style={{ border: 'none', background: 'transparent' }}>
               <span>No forecasts generated yet.</span>
            </div>
          ) : (
            <Table 
              columns={[
                { header: 'Medicine', cell: (row) => row.medicines?.medicine_name || 'Unknown' },
                { 
                  header: 'Current Stock', 
                  cell: (row) => row.medicines?.stock_quantity || 0
                },
                { 
                  header: 'Predicted Demand', 
                  cell: (row) => <Badge variant={row.predicted_demand > (row.medicines?.stock_quantity || 0) ? 'warning' : 'primary'}>{row.predicted_demand}</Badge> 
                },
                { 
                  header: 'Confidence', 
                  cell: (row) => `${Math.round(row.confidence_score * 100)}%`
                }
              ]} 
              data={forecasts} 
            />
          )}
        </Card>
      </div>

      {/* Demand Forecast Analytics Visualization */}
      <ForecastChart />
    </div>
  );
};

export default Dashboard;
