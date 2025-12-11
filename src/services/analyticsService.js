import { getIncidents, getTodayIncidents, getIncidentsByLocation } from './storageService';
import * as Location from 'expo-location';

// Get incident statistics
export const getIncidentStats = async () => {
  try {
    const allIncidents = await getIncidents();
    const todayIncidents = await getTodayIncidents();
    
    // Calculate high-risk areas
    const highRiskAreas = await identifyHighRiskAreas();
    
    return {
      totalIncidents: allIncidents.length,
      todayIncidents: todayIncidents.length,
      highRiskAreas: highRiskAreas.length,
      criticalIncidents: allIncidents.filter(i => i.severity === 'critical').length,
      warningIncidents: allIncidents.filter(i => i.severity === 'warning').length,
    };
  } catch (error) {
    console.error('Error getting incident stats:', error);
    return {
      totalIncidents: 0,
      todayIncidents: 0,
      highRiskAreas: 0,
      criticalIncidents: 0,
      warningIncidents: 0,
    };
  }
};

// Identify high-risk areas based on incident density
export const identifyHighRiskAreas = async () => {
  try {
    const incidents = await getIncidents();
    
    // Group incidents by location clusters
    const clusters = clusterIncidentsByLocation(incidents);
    
    // Filter clusters with high incident density
    const highRiskClusters = clusters.filter(cluster => cluster.incidentCount >= 3);
    
    return highRiskClusters.map(cluster => ({
      center: cluster.center,
      incidentCount: cluster.incidentCount,
      riskLevel: calculateRiskLevel(cluster.incidentCount),
      lastIncident: cluster.lastIncident,
    }));
  } catch (error) {
    console.error('Error identifying high-risk areas:', error);
    return [];
  }
};

// Cluster incidents by location
const clusterIncidentsByLocation = (incidents, radiusKm = 0.5) => {
  const clusters = [];
  const processed = new Set();
  
  incidents.forEach(incident => {
    if (!incident.location || processed.has(incident.id)) return;
    
    const cluster = {
      center: { ...incident.location },
      incidents: [incident],
      incidentCount: 1,
      lastIncident: incident.timestamp,
    };
    
    // Find nearby incidents
    incidents.forEach(other => {
      if (other.id === incident.id || !other.location || processed.has(other.id)) return;
      
      const distance = calculateDistance(
        incident.location.latitude,
        incident.location.longitude,
        other.location.latitude,
        other.location.longitude
      );
      
      if (distance <= radiusKm) {
        cluster.incidents.push(other);
        cluster.incidentCount++;
        processed.add(other.id);
        
        // Update last incident timestamp
        if (new Date(other.timestamp) > new Date(cluster.lastIncident)) {
          cluster.lastIncident = other.timestamp;
        }
      }
    });
    
    if (cluster.incidentCount > 0) {
      clusters.push(cluster);
      processed.add(incident.id);
    }
  });
  
  return clusters;
};

// Calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Calculate risk level
const calculateRiskLevel = (incidentCount) => {
  if (incidentCount >= 10) return 'critical';
  if (incidentCount >= 5) return 'high';
  if (incidentCount >= 3) return 'medium';
  return 'low';
};

// Predict potential accident locations
export const predictAccidentLocations = async () => {
  try {
    const highRiskAreas = await identifyHighRiskAreas();
    const incidents = await getIncidents();
    
    // Analyze patterns
    const predictions = highRiskAreas.map(area => {
      // Get incidents in this area
      const areaIncidents = incidents.filter(incident => {
        if (!incident.location) return false;
        const distance = calculateDistance(
          area.center.latitude,
          area.center.longitude,
          incident.location.latitude,
          incident.location.longitude
        );
        return distance <= 1; // Within 1km
      });
      
      // Analyze time patterns
      const timePatterns = analyzeTimePatterns(areaIncidents);
      
      // Calculate prediction score
      const predictionScore = calculatePredictionScore(area, areaIncidents, timePatterns);
      
      return {
        location: area.center,
        riskLevel: area.riskLevel,
        predictionScore,
        incidentCount: area.incidentCount,
        timePatterns,
        recommendation: generateRecommendation(predictionScore, timePatterns),
      };
    });
    
    // Sort by prediction score (highest risk first)
    return predictions.sort((a, b) => b.predictionScore - a.predictionScore);
  } catch (error) {
    console.error('Error predicting accident locations:', error);
    return [];
  }
};

// Analyze time patterns in incidents
const analyzeTimePatterns = (incidents) => {
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  
  incidents.forEach(incident => {
    const date = new Date(incident.timestamp);
    hourCounts[date.getHours()]++;
    dayCounts[date.getDay()]++;
  });
  
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakDay = dayCounts.indexOf(Math.max(...dayCounts));
  
  return {
    peakHour,
    peakDay,
    hourDistribution: hourCounts,
    dayDistribution: dayCounts,
  };
};

// Calculate prediction score
const calculatePredictionScore = (area, incidents, timePatterns) => {
  let score = 0;
  
  // Base score from incident count
  score += area.incidentCount * 10;
  
  // Recency bonus (more recent incidents = higher risk)
  const now = Date.now();
  const recentIncidents = incidents.filter(i => {
    const incidentTime = new Date(i.timestamp).getTime();
    const daysAgo = (now - incidentTime) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });
  score += recentIncidents.length * 15;
  
  // Time pattern consistency
  const hasClearPattern = timePatterns.hourDistribution.some(count => count >= 2);
  if (hasClearPattern) score += 20;
  
  // Severity bonus
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;
  score += criticalCount * 25;
  
  return Math.min(score, 100); // Cap at 100
};

// Generate recommendation based on prediction
const generateRecommendation = (score, timePatterns) => {
  if (score >= 70) {
    return `منطقة عالية الخطورة. يُنصح بزيادة المراقبة خلال الساعة ${timePatterns.peakHour}:00.`;
  } else if (score >= 40) {
    return `منطقة متوسطة الخطورة. راقب خلال ساعات الذروة.`;
  } else {
    return `منطقة منخفضة الخطورة. يُنصح بالمراقبة القياسية.`;
  }
};

// Get incident trends over time
export const getIncidentTrends = async (days = 30) => {
  try {
    const incidents = await getIncidents();
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const filtered = incidents.filter(incident => {
      const incidentDate = new Date(incident.timestamp);
      return incidentDate >= startDate;
    });
    
    // Group by day
    const dailyCounts = {};
    filtered.forEach(incident => {
      const date = new Date(incident.timestamp).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    return {
      total: filtered.length,
      daily: dailyCounts,
      averagePerDay: filtered.length / days,
      trend: calculateTrend(filtered),
    };
  } catch (error) {
    console.error('Error getting incident trends:', error);
    return { total: 0, daily: {}, averagePerDay: 0, trend: 'مستقر' };
  }
};

// Calculate trend (increasing, decreasing, stable)
const calculateTrend = (incidents) => {
  if (incidents.length < 2) return 'stable';
  
  // Split into two halves
  const mid = Math.floor(incidents.length / 2);
  const firstHalf = incidents.slice(0, mid);
  const secondHalf = incidents.slice(mid);
  
  const firstAvg = firstHalf.length / (mid || 1);
  const secondAvg = secondHalf.length / (incidents.length - mid);
  
  if (secondAvg > firstAvg * 1.2) return 'متزايد';
  if (secondAvg < firstAvg * 0.8) return 'متناقص';
  return 'مستقر';
};

