const supabase = require('../config/supabase');
const { fetchWeather } = require('./weatherService');
const { fetchNewsTrends } = require('./newsService');

const getSeasonalIntelligence = async () => {
  const alerts = [];

  try {
    // 1. Fetch live external intelligence
    const weather = await fetchWeather();
    const news = await fetchNewsTrends();

    // 2. Fetch all active medicines to cross-reference real inventory
    const { data: medicines, error: medError } = await supabase
      .from('medicines')
      .select('id, medicine_name, stock_quantity, reorder_level')
      .neq('status', 'DELETED');

    if (medError) throw medError;

    // Helper function to calculate recommendations based on keywords
    const generateRecommendation = (keywords, conditionType, possibleIncrease) => {
      // Find matching medicines in the DB
      const recommendedMeds = medicines.filter(m => {
        const nameLower = m.medicine_name.toLowerCase();
        return keywords.some(kw => nameLower.includes(kw));
      });

      if (recommendedMeds.length === 0) return null;

      let medBullets = [];
      recommendedMeds.forEach(med => {
        // Mathematical rule: Suggested Stock is 4x Reorder Level for critical seasons
        const suggestedStock = med.reorder_level > 0 ? (med.reorder_level * 4) : 200;
        const need = suggestedStock - med.stock_quantity;
        
        if (need > 0) {
          medBullets.push(
            `• ${med.medicine_name}\n` +
            `  Current Stock: ${med.stock_quantity}\n` +
            `  Suggested Stock: ${suggestedStock}\n` +
            `  Need: +${need}`
          );
        }
      });

      if (medBullets.length === 0) return null;

      const description = `Weather:\n${weather.condition}\n\nTemperature:\n${weather.temperature}°C\n\nHumidity:\n${weather.humidity}%\n\nPossible Seasonal Trend:\n${possibleIncrease} Cases May Increase\n\nRecommended Medicines:\n\n${medBullets.join('\n\n')}`;

      return {
        id: `health-intel-${Date.now()}`,
        alert_type: 'HEALTH_ALERT',
        category: 'Health',
        medicine_name: 'HEALTH ALERT',
        description: description,
        recommended_action: 'Review Inventory Levels',
        priority: 'HIGH',
        created_at: new Date().toISOString()
      };
    };

    // 3. Inference Engine Logic
    let alertCreated = false;

    // Rule A: Heavy Rain / Viral Fever (Weather or News triggered)
    if (weather.condition === 'Heavy Rain' || (news.trendFound && ['Dengue', 'Malaria', 'Viral Fever', 'Flu', 'Influenza'].includes(news.keyword))) {
      const trend = weather.condition === 'Heavy Rain' ? 'Viral Fever' : news.keyword;
      const rec = generateRecommendation(['paracetamol', 'ors', 'cetirizine', 'electral'], 'Heavy Rain', trend);
      if (rec) {
        alerts.push(rec);
        alertCreated = true;
      }
    }

    // Rule B: Heatwave / Dehydration
    if (!alertCreated && (weather.condition === 'Heatwave' || (news.trendFound && ['Heatwave', 'Dehydration'].includes(news.keyword)))) {
      const rec = generateRecommendation(['ors', 'electral', 'glucose'], 'Heatwave', 'Dehydration');
      if (rec) {
        alerts.push(rec);
        alertCreated = true;
      }
    }

    // Rule C: Cold Conditions
    if (!alertCreated && weather.condition === 'Cold Conditions') {
      const rec = generateRecommendation(['cough', 'cetirizine', 'paracetamol'], 'Cold Conditions', 'Cold & Flu');
      if (rec) {
        alerts.push(rec);
        alertCreated = true;
      }
    }

    return alerts;
  } catch (error) {
    console.warn('[SeasonalHealthService] Intelligence generation failed. Proceeding silently.', error.message);
    return [];
  }
};

module.exports = {
  getSeasonalIntelligence
};
