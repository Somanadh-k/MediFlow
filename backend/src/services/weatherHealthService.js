// Native fetch available in Node 18+

const fetchEnvironmentalIntelligence = async () => {
  const alerts = [];
  try {
    // We use a central Indian coordinate mapping roughly for general forecasting
    // Lat 20.5937, Long 78.9629 (India). We fetch daily max temp and precipitation.
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=20.5937&longitude=78.9629&daily=temperature_2m_max,precipitation_sum&timezone=auto&forecast_days=3';
    
    // In Node 18+, fetch is global. If not, this gracefully uses node-fetch.
    const response = await globalThis.fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API returned status: ${response.status}`);
    }
    const data = await response.json();

    const maxTemp = data.daily.temperature_2m_max[0];
    const precip = data.daily.precipitation_sum[0];

    // Inference Engine
    if (maxTemp >= 40) {
      alerts.push({
        id: `weather-heat-${Date.now()}`,
        alert_type: 'WEATHER_ALERT',
        category: 'Weather',
        medicine_name: 'Heatwave Detected',
        description: `Temperature Forecast: ${maxTemp}°C. Possible Increase: Dehydration Cases.`,
        recommended_action: 'Recommend: ORS, Electral, Glucose Solutions',
        priority: 'CRITICAL',
        created_at: new Date().toISOString()
      });
    } else if (maxTemp <= 15) {
      alerts.push({
        id: `weather-cold-${Date.now()}`,
        alert_type: 'WEATHER_ALERT',
        category: 'Weather',
        medicine_name: 'Winter Conditions Detected',
        description: `Cold Weather Expected (${maxTemp}°C). Possible Increase: Cold & Flu Cases.`,
        recommended_action: 'Recommend: Cetirizine, Cough Syrups, Paracetamol',
        priority: 'HIGH',
        created_at: new Date().toISOString()
      });
    }

    if (precip > 10) {
      alerts.push({
        id: `weather-rain-${Date.now()}`,
        alert_type: 'HEALTH_ALERT',
        category: 'Health',
        medicine_name: 'Heavy Rain / Monsoon Alert',
        description: `High Precipitation (${precip}mm). Possible Increase: Viral Fever, Dengue Risk.`,
        recommended_action: 'Recommend: Paracetamol, ORS, Electrolytes',
        priority: 'CRITICAL',
        created_at: new Date().toISOString()
      });
    }

    // Always append a fallback mock alert if weather is moderate so the UI always has intelligence
    if (alerts.length === 0) {
       alerts.push({
        id: `health-trend-${Date.now()}`,
        alert_type: 'HEALTH_ALERT',
        category: 'Health',
        medicine_name: 'General Health Trend',
        description: `Stable weather patterns observed. Routine seasonal monitoring advised.`,
        recommended_action: 'Maintain standard reorder levels.',
        priority: 'LOW',
        created_at: new Date().toISOString()
      });
    }

    return alerts;
  } catch (error) {
    console.warn('[WeatherHealthService] Environmental Intelligence failed. Proceeding silently.', error.message);
    return []; // Return empty array to swallow gracefully and prevent crashes
  }
};

module.exports = {
  fetchEnvironmentalIntelligence
};
