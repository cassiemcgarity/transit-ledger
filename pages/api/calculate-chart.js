import { Origin, Horoscope } from "circular-natal-horoscope-js";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month, day, hour, minute, second, latitude, longitude } = req.body;
    
    // create natal chart
    const natalChart = createChart(
      parseInt(year),
      parseInt(month),
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
      parseFloat(latitude),
      parseFloat(longitude)
    );
    
    // get current date for transit calculations
    const now = new Date();
    
    // create transit chart for current date
    const transitChart = createChart(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      parseFloat(latitude),
      parseFloat(longitude)
    );

    
    // calculate transit aspects
    const transitAspects = calculateTransitAspects(transitChart, natalChart);
    
    // format the response data
    const responseData = {
      natal: {
        planets: natalChart.CelestialBodies.all.map(body => ({
          name: body.label,
          sign: body.Sign.label,
          position: formatPosition(body.ChartPosition.Ecliptic.ArcDegreesFormatted30),
          house: body.House?.id || 'N/A'
        })),
        angles: natalChart.Angles.all.map(angle => ({
          name: angle.label,
          sign: angle.Sign.label,
          position: formatPosition(angle.ChartPosition.Ecliptic.ArcDegreesFormatted30),
          house: determineHouse(angle.ChartPosition.Ecliptic.DecimalDegrees, natalChart.Houses)
        })),
        points: natalChart.CelestialPoints.all.map(point => ({
          name: point.label,
          sign: point.Sign.label,
          position: formatPosition(point.ChartPosition.Ecliptic.ArcDegreesFormatted30),
          house: point.House?.id || determineHouse(point.ChartPosition.Ecliptic.DecimalDegrees, natalChart.Houses)
        }))
      },
      transits: {
        date: now.toISOString(),
        planets: transitChart.CelestialBodies.all.map(body => ({
          name: body.label,
          sign: body.Sign.label,
          position: formatPosition(body.ChartPosition.Ecliptic.ArcDegreesFormatted30),
        }))
      },
      aspects: transitAspects.map(aspect => ({
        transitPlanet: aspect.transitPlanet,
        natalPlanet: aspect.natalPlanet,
        type: aspect.type,
        orb: aspect.orb.toFixed(2)
      }))
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error calculating chart:', error);
    res.status(500).json({ error: 'Failed to calculate chart' });
  }
}

function createChart(year, month, day, hour, minute, second, latitude, longitude) {
  year = parseInt(year, 10);
  month = parseInt(month, 10);
  day = parseInt(day, 10);
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  second = parseInt(second, 10) || 0;
  latitude = parseFloat(latitude);
  longitude = parseFloat(longitude);
  
  try {
    const origin = new Origin({
      year,
      month: month - 1,
      date: day,
      hour,
      minute,
      second,
      latitude,
      longitude,
    });
    console.log("Origin created successfully:", origin);
    
    return new Horoscope({
      origin,
      houseSystem: "whole-sign",
      zodiac: "tropical",
      aspectPoints: ['bodies', 'points', 'angles'],
      aspectWithPoints: ['bodies', 'points', 'angles'],
      aspectTypes: ["major", "minor"],
    });
  } catch (error) {
    console.error("Error creating horoscope:", error);
    throw error;
  }
}

// calculate transit aspects to natal chart
function calculateTransitAspects(transitChart, natalChart) {
  const aspects = [];
  const orbs = {
    conjunction: 1,
    opposition: 1,
    trine: 1,
    square: 1,
    sextile: 1,
    quincunx: 1,
  };
  
  // define aspect angles
  const aspectAngles = {
    conjunction: 0,
    opposition: 180,
    trine: 120,
    square: 90,
    sextile: 60,
    quincunx: 150,
  };
  
  // loop through transit bodies
  transitChart.CelestialBodies.all.forEach(transitBody => {
    // loop through natal bodies, points, and angles
    [...natalChart.CelestialBodies.all, 
     ...natalChart.CelestialPoints.all,
     ...natalChart.Angles.all].forEach(natalPoint => {
      
      // calculate the angular difference
      const transitPos = transitBody.ChartPosition.Ecliptic.DecimalDegrees;
      const natalPos = natalPoint.ChartPosition.Ecliptic.DecimalDegrees;
      
      // find the smallest angle between the two positions
      let diff = Math.abs(transitPos - natalPos);
      if (diff > 180) diff = 360 - diff;
      
      // check for aspects
      for (const [aspectType, angle] of Object.entries(aspectAngles)) {
        const orb = orbs[aspectType] || 5; 

        if (Math.abs(diff - angle) <= orb) {
          aspects.push({
            transitPlanet: `${transitBody.label} at ${transitBody.ChartPosition.Ecliptic.ArcDegreesFormatted30} ${transitBody.Sign.label}`,
            natalPlanet: `${natalPoint.label} at ${natalPoint.ChartPosition.Ecliptic.ArcDegreesFormatted30} ${natalPoint.Sign.label}`,
            type: aspectType,
            orb: Math.abs(diff - angle)
          });
        }
      }
    });
  });
  
  return aspects;
}

// helper function to determine which house a position falls in
function determineHouse(position, houses) {  
  // check each house to see if the position falls within it
  for (let i = 0; i < houses.length; i++) {
    const currentHouse = houses[i];
    
    // get the start and end positions of the house
    let start = currentHouse.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
    let end = currentHouse.ChartPosition.EndPosition.Ecliptic.DecimalDegrees;
    
    // handle crossing 0 degrees for non whole sign
    if (end < start) {
      end += 360;
    }
    
    let checkPosition = position;
    if (checkPosition < start && end > 360) {
      checkPosition += 360;
    }
    
    if (checkPosition >= start && checkPosition < end) {
      return i + 1;
    }
  }
  
  return null;
} 

function formatPosition(position) {
  const index = position.indexOf('\'');
  if (index === -1) {
    return str; // Character not found, return original string
  }
  return position.substring(0, index);
}