const fetchWeather = async () => {
  const city = process.env.CITY || 'Hyderabad';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn('[WeatherService] OPENWEATHER_API_KEY is missing. Using mocked fallback data.');
    return {
      temperature: 29,
      humidity: 91,
      condition: 'Heavy Rain'
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API returned status: ${response.status}`);
    }
    const data = await response.json();
    
    // Map condition to recognizable trends
    let condition = data.weather[0].main; 
    if (data.weather[0].id >= 200 && data.weather[0].id < 600) {
      condition = 'Heavy Rain';
    } else if (data.main.temp > 40) {
      condition = 'Heatwave';
    } else if (data.main.temp < 15) {
      condition = 'Cold Conditions';
    }

    return {
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      condition: condition
    };
  } catch (error) {
    console.error('[WeatherService] Failed to fetch weather. Using fallback.', error.message);
    return {
      temperature: 29,
      humidity: 91,
      condition: 'Heavy Rain'
    };
  }
};

module.exports = { fetchWeather };
