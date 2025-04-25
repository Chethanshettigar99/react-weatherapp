// src/App.tsx
import  { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './App.css';

// Import background images
import clearBg from './img/sun.jpg';
import cloudsBg from './img/cloud.jpeg';
import rainBg from './img/rain.jpg';
import thunderstormBg from './img/thunder.jpg';
import snowBg from './img/snow.jpg';
import mistBg from './img/mist.jpg';
import defaultBg from './img/ind.jpg';

// Interfaces
interface Weather {
    main: string;
    description: string;
    icon: string;
}

interface Main {
    temp: number;
    feels_like: number;
    humidity: number;
}

interface Wind {
    speed: number;
}

interface Sys {
    country: string;
}

interface WeatherData {
    name: string;
    sys: Sys;
    main: Main;
    weather: Weather[];
    wind: Wind;
}

interface ForecastItem {
    dt: number;
    main: Main;
    weather: Weather[];
}

function App() {
    const [city, setCity] = useState<string>('');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [forecastData, setForecastData] = useState<ForecastItem[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<string>(defaultBg);
    const [isCelsius, setIsCelsius] = useState<boolean>(true);

    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    const baseUrl = import.meta.env.VITE_OPENWEATHERMAP_BASE_URL;

    const celsiusToFahrenheit = (celsius: number): number => (celsius * 9/5) + 32;
    const toggleTemperatureUnit = () => setIsCelsius(!isCelsius);

    const fetchWeatherData = async () => {
        if (!city) {
            setError('Please enter a city name.');
            setWeatherData(null);
            setForecastData(null);
            setBackgroundImage(defaultBg);
            return;
        }

        setLoading(true);
        setError(null);
        setWeatherData(null);
        setForecastData(null);
        setBackgroundImage(defaultBg);

        try {
            const weatherUrl = `${baseUrl}weather?q=${city}&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            if (!weatherResponse.ok) {
                throw new Error(`HTTP error! status: ${weatherResponse.status} - Could not fetch current weather.`);
            }
            const currentWeatherData: WeatherData = await weatherResponse.json();
            setWeatherData(currentWeatherData);

            const forecastUrl = `${baseUrl}forecast?q=${city}&appid=${apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error(`HTTP error! status: ${forecastResponse.status} - Could not fetch forecast.`);
            }
            const forecastJsonData = await forecastResponse.json();

            const dailyForecasts: { [date: string]: ForecastItem } = {};
            forecastJsonData.list.forEach((item: ForecastItem) => {
                const date = new Date(item.dt * 1000).toLocaleDateString();
                if (!dailyForecasts[date] || Math.abs(new Date(item.dt * 1000).getHours() - 12) < Math.abs(new Date(dailyForecasts[date].dt * 1000).getHours() - 12)) {
                    dailyForecasts[date] = item;
                }
            });

            const currentDate = new Date();
            let forecastArray = Object.values(dailyForecasts);

            if (forecastArray.length < 5) {
                const lastDay = forecastArray.length > 0 
                    ? new Date(forecastArray[forecastArray.length - 1].dt * 1000) 
                    : currentDate;

                for (let i = forecastArray.length; i < 7; i++) {
                    const nextDay = new Date(lastDay);
                    nextDay.setDate(nextDay.getDate() + (i - forecastArray.length + 1));

                    const placeholderDay: ForecastItem = {
                        dt: nextDay.getTime() / 1000,
                        main: {
                            temp: forecastArray.length > 0 ? forecastArray[forecastArray.length - 1].main.temp : 20,
                            feels_like: forecastArray.length > 0 ? forecastArray[forecastArray.length - 1].main.feels_like : 20,
                            humidity: 50,
                        },
                        weather: [{
                            main: "Clouds",
                            description: "projected forecast",
                            icon: "04d"
                        }]
                    };
                    forecastArray.push(placeholderDay);
                }
            }

            setForecastData(forecastArray.slice(0, 7));

        } catch (err: any) {
            console.error("Fetching error:", err);
            setError(err.message || 'Failed to fetch weather data. Check the city name and API key.');
            setWeatherData(null);
            setForecastData(null);
            setBackgroundImage(defaultBg);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setCity(event.target.value);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        fetchWeatherData();
    };

    useEffect(() => {
        if (weatherData && weatherData.weather.length > 0) {
            const condition = weatherData.weather[0].main.toLowerCase();
            switch (condition) {
                case 'clear':
                    setBackgroundImage(clearBg);
                    break;
                case 'clouds':
                    setBackgroundImage(cloudsBg);
                    break;
                case 'rain':
                case 'drizzle':
                    setBackgroundImage(rainBg);
                    break;
                case 'thunderstorm':
                    setBackgroundImage(thunderstormBg);
                    break;
                case 'snow':
                    setBackgroundImage(snowBg);
                    break;
                case 'mist':
                case 'smoke':
                case 'haze':
                case 'fog':
                    setBackgroundImage(mistBg);
                    break;
                default:
                    setBackgroundImage(defaultBg);
                    break;
            }
        } else {
            setBackgroundImage(defaultBg);
        }
    }, [weatherData]);

    return (
        <div className="App" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="content-wrapper">
                <div className="app-header">
                    <h1>Weather <span className="highlight">Forecast</span></h1>
                    <p className="tagline">Your reliable weather companion</p>
                </div>

                <form onSubmit={handleSubmit} className="search-form">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Enter city name..."
                            value={city}
                            onChange={handleInputChange}
                            className="search-input"
                        />
                        <button type="submit" disabled={loading} className="search-button">
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <span className="search-icon">🔍</span>
                                    <span className="search-text">Search</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {error && <p className="error">{error}</p>}

                {weatherData && !error && (
                    <div className="weather-current">
                        <h2>Current Weather in {weatherData.name}, {weatherData.sys?.country}</h2>
                        <div className="weather-info">
                            <img
                                src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                                alt={weatherData.weather[0].description}
                            />
                            <div className="weather-details">
                                <div className="temp-display">
                                    {isCelsius 
                                        ? `${weatherData.main.temp.toFixed(1)}` 
                                        : `${celsiusToFahrenheit(weatherData.main.temp).toFixed(1)}`}
                                    <span className="unit">{isCelsius ? '°C' : '°F'}</span>
                                    <button 
                                        onClick={toggleTemperatureUnit}
                                        className="temp-toggle-btn inline-btn"
                                    >
                                        Switch to {isCelsius ? '°F' : '°C'}
                                    </button>
                                </div>
                                <p><strong>Feels like:</strong> 
                                    {isCelsius 
                                        ? `${weatherData.main.feels_like.toFixed(1)}°C` 
                                        : `${celsiusToFahrenheit(weatherData.main.feels_like).toFixed(1)}°F`}
                                </p>
                                <p><strong>Condition:</strong> {weatherData.weather[0].description}</p>
                                <p><strong>Humidity:</strong> {weatherData.main.humidity}%</p>
                                <p><strong>Wind Speed:</strong> {weatherData.wind.speed} m/s</p>
                            </div>
                        </div>
                    </div>
                )}

                {forecastData && forecastData.length > 0 && !error && (
                    <div className="weather-forecast">
                        <h2>6-DAY FORECAST</h2>
                        <div className="forecast-container">
                            {forecastData.map((item, index) => (
                                <div key={index} className="forecast-item">
                                    <div className="forecast-day">
                                        {new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </div>
                                    <div className="forecast-icon">
                                        <img
                                            src={`http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                                            alt={item.weather[0].description}
                                        />
                                    </div>
                                    <div className="forecast-desc">{item.weather[0].description}</div>
                                    <div className="forecast-temp">
                                        {isCelsius 
                                            ? `${item.main.temp.toFixed(0)}°` 
                                            : `${celsiusToFahrenheit(item.main.temp).toFixed(0)}°`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
