export interface WeatherIcon {
  description: string;
  day: string;
  night: string;
}

export const WEATHER_ICONS: Record<number, WeatherIcon> = {
  0: {
    description: 'Clear sky',
    day: '☀️',
    night: '🌙'
  },
  1: {
    description: 'Mainly clear',
    day: '🌤️',
    night: '🌙'
  },
  2: {
    description: 'Partly cloudy',
    day: '⛅',
    night: '☁️'
  },
  3: {
    description: 'Overcast',
    day: '☁️',
    night: '☁️'
  },
  45: {
    description: 'Fog',
    day: '🌫️',
    night: '🌫️'
  },
  48: {
    description: 'Depositing rime fog',
    day: '🌫️',
    night: '🌫️'
  },
  51: { description: 'Light drizzle', day: '🌦️', night: '🌧️' },
  53: { description: 'Moderate drizzle', day: '🌦️', night: '🌧️' },
  55: { description: 'Dense drizzle', day: '🌧️', night: '🌧️' },
  56: { description: 'Freezing drizzle', day: '🌧️', night: '🌧️' },
  57: { description: 'Freezing drizzle', day: '🌧️', night: '🌧️' },
  61: { description: 'Slight rain', day: '🌦️', night: '🌧️' },
  63: { description: 'Moderate rain', day: '🌧️', night: '🌧️' },
  65: { description: 'Heavy rain', day: '🌧️', night: '🌧️' },
  66: { description: 'Freezing rain', day: '🌧️', night: '🌧️' },
  67: { description: 'Heavy freezing rain', day: '🌧️', night: '🌧️' },
  71: { description: 'Slight snow', day: '🌨️', night: '🌨️' },
  73: { description: 'Moderate snow', day: '❄️', night: '❄️' },
  75: { description: 'Heavy snow', day: '❄️', night: '❄️' },
  77: { description: 'Snow grains', day: '❄️', night: '❄️' },
  80: { description: 'Rain showers', day: '🌦️', night: '🌧️' },
  81: { description: 'Moderate rain showers', day: '🌧️', night: '🌧️' },
  82: { description: 'Heavy rain showers', day: '⛈️', night: '⛈️' },
  85: { description: 'Snow showers', day: '🌨️', night: '🌨️' },
  86: { description: 'Heavy snow showers', day: '❄️', night: '❄️' },
  95: { description: 'Thunderstorm', day: '⛈️', night: '⛈️' },
  96: { description: 'Thunderstorm with hail', day: '⛈️', night: '⛈️' },
  97: { description: 'Heavy thunderstorm', day: '⛈️', night: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', day: '⛈️', night: '⛈️' }
};