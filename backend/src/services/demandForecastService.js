const supabase = require('../config/supabase');

/**
 * Service to handle Demand Forecast data retrieval.
 * Note: The actual generation of these forecasts is handled purely by the n8n Demand Forecast Agent
 * directly connecting to Supabase via a Scheduled Trigger.
 */

const getLatestDemandForecasts = async () => {
  try {
    const { data, error } = await supabase
      .from('demand_forecasts')
      .select(`
        *,
        medicines (
          medicine_name,
          stock_quantity
        )
      `)
      .order('predicted_demand', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching demand forecasts from Supabase:', error.message);
    throw error;
  }
};

const getForecastForMedicine = async (medicineId) => {
  try {
    const { data, error } = await supabase
      .from('demand_forecasts')
      .select('predicted_demand, confidence_score, recommendation')
      .eq('medicine_id', medicineId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error(`Error fetching forecast for medicine ${medicineId}:`, error.message);
    return null; // Return null safely so consumers (like Procurement Agent) don't crash
  }
};

module.exports = {
  getLatestDemandForecasts,
  getForecastForMedicine,
};
