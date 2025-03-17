import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

//Astronomicon font mapping
const getAstroSymbol = (name) => {
  const symbols = {
    // planets
    'Sun': 'Q',
    'Moon': 'R',
    'Mercury': 'S',
    'Venus': 'T',
    'Mars': 'U',
    'Jupiter': 'V',
    'Saturn': 'W',
    'Uranus': 'X',
    'Neptune': 'Y',
    'Pluto': 'Z',
    'Chiron': 'q',
    
    // calculated points
    'North': 'g',
    'South': 'i',
    'Lilith': 'z',
    'Ascendant': 'c', 
    'Descendant': 'f',
    'Midheaven': 'd',
    'IC': 'e', 
    
    // signs
    'Aries': 'A',
    'Taurus': 'B',
    'Gemini': 'C',
    'Cancer': 'D',
    'Leo': 'E',
    'Virgo': 'F',
    'Libra': 'G',
    'Scorpio': 'H',
    'Sagittarius': 'I',
    'Capricorn': '\\',
    'Aquarius': 'K',
    'Pisces': 'L',
    
    // aspects
    'conjunction': '!',
    'opposition': '"',
    'trine': '$',
    'square': '#',
    'sextile': '%',
    'quincunx': '&',
  };
  
  return symbols[name] || name;
};

const getSignFromPosition = (positionString) => {
  if (!positionString) return '';
  const signMatch = positionString.match(/([A-Za-z]+)/);
  return signMatch ? signMatch[1] : '';
};

export default function Home() {
  const [birthData, setBirthData] = useState({
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0,
    latitude: 40.7128,
    longitude: -74.0060,
    currentLatitude: 40.7128, 
    currentLongitude: -74.0060,
    period: 'PM'
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showResults, setShowResults] = useState(false);

  // form fade out animation
  useEffect(() => {
    let timer;
    if (results && !showResults) {
      timer = setTimeout(() => {
        setShowResults(true);
      }, 200);
    }
    return () => clearTimeout(timer);
  }, [results, showResults]);

  const handleChange = (e) => {
    setBirthData({
      ...birthData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let hour24 = parseInt(birthData.hour);
      if (birthData.period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (birthData.period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }

      const response = await fetch('/api/calculate-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...birthData,
          hour: hour24
        }),
      });
      
      const data = await response.json();
      setResults(data);
      
      setShowForm(false);
      setShowResults(false);
      
    } catch (error) {
      console.error('Error calculating chart:', error);
      alert('Error calculating chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    
    setTimeout(() => {
      setResults(null);
      setShowForm(true);
    }, 300);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBirthData(prev => ({
          ...prev,
          currentLatitude: position.coords.latitude,
          currentLongitude: position.coords.longitude
        }));
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            alert("Location permission denied. Please enable location access or enter coordinates manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information unavailable. Please enter coordinates manually.");
            break;
          case error.TIMEOUT:
            alert("Location request timed out. Please try again or enter coordinates manually.");
            break;
          default:
            alert("An error occurred getting your location. Please enter coordinates manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Astrology Transit Calculator</h1>
        <p className={styles.description}>
          Enter your birth details to calculate your astrological transits
        </p>

        <div className={`${styles.card} ${!showForm && styles.fadeOut}`}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h2>Birth Date</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="year">Year:</label>
                  <input 
                    type="number" 
                    id="year"
                    name="year" 
                    value={birthData.year} 
                    onChange={handleChange} 
                    min="1900" 
                    max="2100"
                    required 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="month">Month:</label>
                  <select 
                    id="month"
                    name="month" 
                    value={birthData.month} 
                    onChange={handleChange}
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="day">Day:</label>
                  <input 
                    type="number" 
                    id="day"
                    name="day" 
                    value={birthData.day} 
                    onChange={handleChange} 
                    min="1" 
                    max="31"
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2>Birth Time</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="hour">Hour:</label>
                  <input 
                    type="number" 
                    id="hour"
                    name="hour" 
                    value={birthData.hour} 
                    onChange={handleChange} 
                    min="1" 
                    max="12"
                    required 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="period">AM/PM:</label>
                  <select
                    id="period"
                    name="period"
                    value={birthData.period}
                    onChange={handleChange}
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="minute">Minute:</label>
                  <input 
                    type="number" 
                    id="minute"
                    name="minute" 
                    value={birthData.minute} 
                    onChange={handleChange} 
                    min="0" 
                    max="59"
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2>Birth Location</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="latitude">Latitude:</label>
                  <input 
                    type="number" 
                    id="latitude"
                    name="latitude" 
                    value={birthData.latitude} 
                    onChange={handleChange} 
                    step="0.000001"
                    min="-90"
                    max="90"
                    required 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="longitude">Longitude:</label>
                  <input 
                    type="number" 
                    id="longitude"
                    name="longitude" 
                    value={birthData.longitude} 
                    onChange={handleChange} 
                    step="0.000001"
                    min="-180"
                    max="180"
                    required 
                  />
                </div>
              </div>
              <p className={styles.hint}>
                Tip: You can find your coordinates by searching your birthplace on Google Maps
              </p>
            </div>

            <div className={styles.formSection}>
              <h2>Current Location</h2>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentLatitude">Current Latitude:</label>
                  <input 
                    type="number" 
                    id="currentLatitude"
                    name="currentLatitude" 
                    value={birthData.currentLatitude} 
                    onChange={handleChange} 
                    step="0.000001"
                    min="-90"
                    max="90"
                    required 
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="currentLongitude">Current Longitude:</label>
                  <input 
                    type="number" 
                    id="currentLongitude"
                    name="currentLongitude" 
                    value={birthData.currentLongitude} 
                    onChange={handleChange} 
                    step="0.000001"
                    min="-180"
                    max="180"
                    required 
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  className={`${styles.button} ${styles.secondaryButton}`}
                  disabled={loading}
                >
                  {loading ? 'Getting Location...' : 'Use Current Location'}
                </button>
              </div>
              <p className={styles.hint}>
                Tip: Click "Use Current Location" or find coordinates on Google Maps
              </p>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.button}
                disabled={loading}
              >
                {loading ? 'Calculating...' : 'Calculate Transit Chart'}
              </button>
            </div>
          </form>
        </div>
        
        {results && (
          <div className={`${styles.resultsContainer} ${showResults && styles.fadeIn}`}>
            <h2>Your Transit Results</h2>
            <div className={styles.resultsHeader}>
              <h3>Birth Chart: {birthData.month}/{birthData.day}/{birthData.year} at {birthData.hour}:{birthData.minute} {birthData.period}</h3>
            </div>
            <div className={styles.resultsContent}>
              {/* Natal Chart Section */}
              <div className={styles.resultSection}>
                <h4>Natal Placements</h4>
                <ul className={styles.planetList}>
                  {results.natal.planets
                    .filter(planet => planet.name !== 'Sirius')
                    .map((planet, index) => (
                      <li key={index} className={styles.planetItem}>
                        <span className={styles.planetName}>
                          <span className={styles.planetSymbol}>{getAstroSymbol(planet.name)}</span>
                          {planet.name}
                        </span>
                        <span className={styles.planetPosition}>
                          <span className={styles.signSymbol}>{getAstroSymbol(getSignFromPosition(planet.sign))}</span>
                          <span>{planet.sign} {planet.position}</span>
                        </span>
                        <span className={styles.planetHouse}>House {planet.house}</span>
                      </li>
                    ))}
                    {results.natal.points
                      .map((point, index) => (
                        <li key={index} className={styles.planetItem}>
                          <span className={styles.planetName}>
                            <span className={styles.planetSymbol}>{getAstroSymbol(
                              point.name == 'North Node' ? 'North' 
                              : point.name == 'South Node' ? 'South' 
                              : point.name)}</span>
                            {point.name}
                          </span>
                          <span className={styles.planetPosition}>
                            <span className={styles.signSymbol}>{getAstroSymbol(getSignFromPosition(point.sign))}</span>
                            <span>{point.sign} {point.position}</span>
                          </span>
                          <span className={styles.planetHouse}>House {point.house}</span>
                      </li>
                    ))}
                    {results.natal.angles
                      .map((angle, index) => (
                        <li key={index} className={styles.planetItem}>
                          <span className={styles.planetName}>
                            <span className={styles.planetSymbol}>{getAstroSymbol(angle.name)}</span>
                            {angle.name}
                          </span>
                          <span className={styles.planetPosition}>
                            <span className={styles.signSymbol}>{getAstroSymbol(getSignFromPosition(angle.sign))}</span>
                            <span>{angle.sign} {angle.position}</span>
                          </span>
                          <span className={styles.planetHouse}>House {angle.house}</span>
                        </li>
                      ))}
                </ul>
              </div>
              
              {/* Transit Section */}
              <div className={styles.resultSection}>
                <h4>Current Planetary Positions</h4>
                <p className={styles.transitDate}>
                  {new Date(results.transits.date).toLocaleDateString()} at {new Date(results.transits.date).toLocaleTimeString()}
                </p>
                <ul className={styles.planetList}>
                  {results.transits.planets
                    .filter(planet => planet.name !== 'Sirius')
                    .map((planet, index) => (
                      <li key={index} className={styles.planetItem}>
                        <span className={styles.planetName}>
                          <span className={styles.planetSymbol}>{getAstroSymbol(planet.name)}</span>
                          {planet.name}
                        </span>
                        <span className={styles.planetPosition}>
                          <span className={styles.signSymbol}>{getAstroSymbol(getSignFromPosition(planet.sign))}</span>
                          <span>{planet.sign} {planet.position}</span>
                        </span>
                        </li>
                      ))}
                </ul>
              </div>
              
              {/* Aspects Section */}
              <div className={styles.resultSection}>
                <h4>Current Transit Aspects</h4>
                <ul className={styles.aspectList}>
                  {results.aspects
                    .filter(aspect => 
                      !aspect.transitPlanet.includes('Sirius') && 
                      !aspect.natalPlanet.includes('Sirius')
                    )
                    .map((aspect, index) => {
                      const transitPlanetName = aspect.transitPlanet.split(' ')[0];
                      const natalPlanetName = aspect.natalPlanet.split(' ')[0];
                      
                      return (
                        <li key={index} className={styles.aspectItem}>
                          <span className={styles.aspectPlanets}>
                            <span className={styles.planetSymbol}>{getAstroSymbol(transitPlanetName)}</span>
                            <span>{transitPlanetName}</span>
                            <span className={styles.aspectSymbol}>{getAstroSymbol(aspect.type)}</span>
                            <span className={styles.planetSymbol}>{getAstroSymbol(natalPlanetName)}</span>
                            <span>{natalPlanetName}</span>
                          </span>
                          <span className={styles.aspectOrb}>
                            {aspect.orb}°
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                onClick={handleReset} 
                className={styles.button}
              >
                Calculate New Chart
              </button>
            </div>
          </div>
        )}
      </main>
      
      <footer className={styles.footer}>
        <p>Powered by CircularNatalHoroscopeJS</p>
      </footer>
    </div>
  );
}