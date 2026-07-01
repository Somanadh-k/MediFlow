const supabase = require('../config/supabase');
const { successResponse, errorResponse } = require('../utils/response');

const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    // 1. Fetch active medicines for stock & expiry alerts
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('id, medicine_name, stock_quantity, reorder_level, expiry_date, status')
      .neq('status', 'DELETED');
      
    if (medError) throw medError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    medicines.forEach(med => {
      // Stock Alerts
      if (med.stock_quantity === 0) {
        alerts.push({
          id: `out-of-stock-${med.id}`,
          alert_type: 'OUT_OF_STOCK',
          category: 'Stock',
          medicine_name: med.medicine_name,
          description: `Current Stock: 0`,
          recommended_action: 'Immediate Procurement Required',
          priority: 'CRITICAL',
          created_at: new Date().toISOString()
        });
      } else if (med.stock_quantity <= med.reorder_level) {
        alerts.push({
          id: `low-stock-${med.id}`,
          alert_type: 'LOW_STOCK',
          category: 'Stock',
          medicine_name: med.medicine_name,
          description: `Current Stock: ${med.stock_quantity} (Reorder Level: ${med.reorder_level})`,
          recommended_action: 'Reorder Recommended',
          priority: 'HIGH',
          created_at: new Date().toISOString()
        });
      }

      // Expiry & Quarantine Alerts
      if (med.status === 'QUARANTINED') {
        alerts.push({
          id: `quarantine-${med.id}`,
          alert_type: 'QUARANTINE_ALERT',
          category: 'Expiry',
          medicine_name: med.medicine_name,
          description: `Medicine moved to quarantine.`,
          recommended_action: 'Review Required',
          priority: 'HIGH',
          created_at: new Date().toISOString()
        });
      } else if (med.expiry_date) {
        const expDate = new Date(med.expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          alerts.push({
            id: `expired-${med.id}`,
            alert_type: 'EXPIRED_MEDICINE',
            category: 'Expiry',
            medicine_name: med.medicine_name,
            description: `Expired`,
            recommended_action: 'Move to Quarantine',
            priority: 'CRITICAL',
            created_at: new Date().toISOString()
          });
        } else if (daysRemaining <= 30) {
          alerts.push({
            id: `expiring-30-${med.id}`,
            alert_type: 'EXPIRY_ALERT',
            category: 'Expiry',
            medicine_name: med.medicine_name,
            description: `Expires in ${daysRemaining} Days (Current Stock: ${med.stock_quantity})`,
            recommended_action: 'Monitor Inventory',
            priority: 'MEDIUM',
            created_at: new Date().toISOString()
          });
        } else if (daysRemaining <= 90) {
          alerts.push({
            id: `expiring-90-${med.id}`,
            alert_type: 'EXPIRY_ALERT',
            category: 'Expiry',
            medicine_name: med.medicine_name,
            description: `Expires in ${daysRemaining} Days (Current Stock: ${med.stock_quantity})`,
            recommended_action: 'Plan Stock Rotation',
            priority: 'LOW',
            created_at: new Date().toISOString()
          });
        }
      }
    });

    // 2. Fetch Agent Decision Logs
    const { data: agentLogs, error: agentError } = await supabase
      .from('agent_decision_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (agentError) throw agentError;

    if (agentLogs) {
      agentLogs.forEach(log => {
        let medName = 'Unknown Medicine';
        let action = 'Review Recommendation';
        let desc = log.recommendation;

        try {
          const parsed = JSON.parse(log.recommendation);
          desc = parsed.message || desc;
          if (parsed.medicine_id) {
            const matchedMed = medicines.find(m => m.id === parsed.medicine_id);
            if (matchedMed) medName = matchedMed.medicine_name;
          }
          if (parsed.quantity) action = `Suggested Quantity: ${parsed.quantity}`;
          if (parsed.predicted_demand) action = `Forecast Increase: ${parsed.predicted_demand}`;
        } catch (e) {
          // If it's a raw string and we can't parse it
          desc = log.recommendation;
        }

        const priority = 'MEDIUM'; // Default agent priority
        
        // Extract medicine name from string if it wasn't parsed from JSON
        if (medName === 'Unknown Medicine' && typeof log.recommendation === 'string') {
           const match = log.recommendation.match(/for\s+(.*?)\./);
           if (match) medName = match[1];
           else if (log.recommendation.includes(':')) {
             const parts = log.recommendation.split(':');
             if (parts.length > 1) {
               const subMatch = parts[1].split('(');
               if (subMatch.length > 0) medName = subMatch[0].trim();
             }
           }
        }

        if (log.agent_name.includes('Procurement')) {
          alerts.push({
            id: `agent-${log.id}`,
            alert_type: 'PROCUREMENT_AGENT_ALERT',
            category: 'Agent',
            medicine_name: medName !== 'Unknown Medicine' ? medName : 'Procurement Action',
            description: desc,
            recommended_action: action,
            priority: 'HIGH',
            created_at: log.created_at
          });
        } else if (log.agent_name.includes('Demand')) {
          alerts.push({
            id: `agent-${log.id}`,
            alert_type: 'DEMAND_FORECAST_ALERT',
            category: 'Agent',
            medicine_name: medName !== 'Unknown Medicine' ? medName : 'Demand Analysis',
            description: desc,
            recommended_action: action,
            priority: 'MEDIUM',
            created_at: log.created_at
          });
        }
      });
    }

    // 3. Fetch Weather & Health Intelligence
    const { getSeasonalIntelligence } = require('../services/seasonalHealthService');
    const externalAlerts = await getSeasonalIntelligence();
    alerts.push(...externalAlerts);

    // Sort combined payload
    alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return successResponse(res, alerts);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch alerts', err);
  }
};

module.exports = {
  getAlerts,
};
