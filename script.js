// Initialize the map centered on Peru
const map = L.map("map").setView([-9.19, -75.015], 6);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

map.createPane("linesPane");
map.getPane("linesPane").style.zIndex = 400; // Lower zIndex for lines
map.createPane("markersPane");
map.getPane("markersPane").style.zIndex = 650; // Higher zIndex for markers (wells/gateways)

// Generate random well data focusing on rural areas on land
const ruralAreas = [
  { latMin: -16, latMax: -13, lonMin: -74, lonMax: -71 },
  { latMin: -14, latMax: -11, lonMin: -77, lonMax: -75 },
  { latMin: -10, latMax: -8, lonMin: -76, lonMax: -73 },
  { latMin: -15, latMax: -12, lonMin: -70, lonMax: -68 },
];

const isLand = (lat, lon) => {
  return !(lon < -80 && lat > -18); // Excludes western coastal areas
};

// Generate random wells
const generateRuralWells = (count) => {
  const wells = [];
  while (wells.length < count) {
    const area = ruralAreas[Math.floor(Math.random() * ruralAreas.length)];
    const lat = Math.random() * (area.latMax - area.latMin) + area.latMin;
    const lon = Math.random() * (area.lonMax - area.lonMin) + area.lonMin;

    if (isLand(lat, lon)) {
      wells.push({
        lat,
        lon,
        pH: (6.5 + Math.random() * 2).toFixed(2),
        lead: (Math.random() * 0.1).toFixed(4),
        coliform: Math.floor(Math.random() * 101),
        temperature: (20 + Math.random() * 5).toFixed(2),
        tds: (50 + Math.random() * 500).toFixed(2),
        alert: false, // Default alert status
        issue: "", // Specific issue causing the alert
      });
    }
  }
  return wells;
};

// Randomly set alerts for a subset of wells
const setAlerts = (wells, alertCount) => {
  const alertIndices = new Set();
  while (alertIndices.size < alertCount) {
    alertIndices.add(Math.floor(Math.random() * wells.length));
  }

  alertIndices.forEach((index) => {
    const well = wells[index];
    well.alert = true;

    // Randomly assign an issue
    if (well.pH < 6.5 || well.pH > 8.5) {
      well.issue = "pH out of range";
    } else if (well.lead > 0.05) {
      well.issue = "Lead levels too high";
    } else if (well.coliform > 50) {
      well.issue = "High coliform levels";
    } else if (well.temperature > 40) {
      well.issue = "High temperature levels";
    } else if (well.tds > 500) {
      well.issue = "High TDS levels";
    } else {
      well.issue = "Unknown issue";
    }
  });
};

const generateGateways = (count) => {
  const gateways = [];
  while (gateways.length < count) {
    const area = ruralAreas[Math.floor(Math.random() * ruralAreas.length)];
    const lat = Math.random() * (area.latMax - area.latMin) + area.latMin;
    const lon = Math.random() * (area.lonMax - area.lonMin) + area.lonMin;

    if (isLand(lat, lon)) {
      gateways.push({ lat, lon });
    }
  }
  return gateways;
};

// Calculate the distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Generate data
const wells = generateRuralWells(40);
setAlerts(wells, 5);
const gateways = generateGateways(8);

// Add gateways to the map
const gatewayMarkers = gateways.map((gateway, index) => {
  const marker = L.circle([gateway.lat, gateway.lon], {
    pane: "markersPane", // Place gateways in the markersPane
    color: "red",
    fillColor: "#ff4d4d",
    fillOpacity: 1,
    radius: 5000,
  }).addTo(map);

  marker.on("click", () => {
    const popupContent = `<div><h3>LoRa Gateway #${
      index + 1
    }</h3></div><div><p>RECEIVING...OK</p></div><div><p>SENDING...OK</p></div>`;
    marker.bindPopup(popupContent).openPopup();
  });

  return marker;
});

L.control
  .Legend({
    position: "bottomleft",
    legends: [
      {
        label: "NuFlo Well Sensor",
        type: "circle",
        color: "blue",
        fillColor: "#007bff",
        fill: true,
      },
      {
        label: "NuFlo Alert",
        type: "circle",
        fillColor: "#ffa500",
        fill: true,
      },
      {
        label: "NuFlo Data Gateway",
        type: "circle",
        color: "red",
        fillColor: "#ff4d4d",
        fill: true,
      },
    ],
  })
  .addTo(map);

wells.forEach((well, index) => {
  const markerOptions = well.alert
    ? {
        pane: "markersPane",
        color: "orange",
        fillColor: "#ffa500",
        fillOpacity: 1.0,
        radius: 5000,
        className: "alert-glow",
      }
    : {
        pane: "markersPane",
        color: "blue",
        fillColor: "#007bff",
        fillOpacity: 1.0,
        radius: 5000,
      };

  const marker = L.circle([well.lat, well.lon], markerOptions).addTo(map);

  // Add ripple effect for alert wells
  if (well.alert) {
    const rippleContainer = document.createElement("div");
    rippleContainer.classList.add("alert-ripple");

    // Append the ripple to the map's container
    const markerElement = marker.getElement();
    markerElement.parentElement.appendChild(rippleContainer);

    // Position the ripple correctly
    const mapPane = document.querySelector(".leaflet-marker-pane");
    const rect = markerElement.getBoundingClientRect();
    rippleContainer.style.left = `${rect.left + rect.width / 2}px`;
    rippleContainer.style.top = `${rect.top + rect.height / 2}px`;
  }

  // Find the nearest gateway
  let nearestGateway = null;
  let minDistance = Infinity;
  gateways.forEach((gateway) => {
    const distance = calculateDistance(
      well.lat,
      well.lon,
      gateway.lat,
      gateway.lon
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestGateway = { lat: gateway.lat, lon: gateway.lon };
    }
  });

  // Draw a line connecting the well to the nearest gateway
  if (nearestGateway) {
    L.polyline(
      [
        [well.lat, well.lon],
        [nearestGateway.lat, nearestGateway.lon],
      ],
      {
        pane: "linesPane", // Place lines in the linesPane
        color: "green",
        weight: 2,
        dashArray: "5, 5",
      }
    ).addTo(map);
  }

  // Show data when the well is clicked
  marker.on("click", () => {
    const popupContent = well.alert
      ? `
                <div>
                    <h3>Water Well #${index + 1}</h3>
                    <p><strong>ALERT:</strong> ${well.issue}</p>
                    <p><strong>pH:</strong> ${well.pH}</p>
                    <p><strong>Lead:</strong> ${well.lead} ppb</p>
                    <p><strong>Coliform:</strong> ${well.coliform} CFU/100ml</p>
                    <p><strong>Temperature:</strong> ${well.temperature} C</p>
                    <p><strong>TDS:</strong> ${well.tds} ppm</p>
                
                </div>
            `
      : `
                <div>
                    <h3>Water Well #${index + 1}</h3>
                    <p><strong>pH:</strong> ${well.pH}</p>
                    <p><strong>Lead:</strong> ${well.lead} ppb</p>
                    <p><strong>Coliform:</strong> ${well.coliform} CFU/100ml</p>
                    <p><strong>Temperature:</strong> ${well.temperature} C</p>
                    <p><strong>TDS:</strong> ${well.tds} ppm</p>
                </div>
            `;

    marker.bindPopup(popupContent).openPopup();
  });
});

// Add glowing animation for alert markers
const style = document.createElement("style");
style.innerHTML = `
.alert-glow {
    animation: fade-color 1s infinite; /* Updated animation */
}

@keyframes fade-color {
    0% {
        fill: #ff4500; /* Start with a reddish orange */
        stroke: #ff4500;
    }
    50% {
        fill: #ffa500; /* Transition to a bright orange */
        stroke: #ffa500;
    }
    100% {
        fill: #ff4500; /* Return to reddish orange */
        stroke: #ff4500;
    }
}
`;

document.head.appendChild(style);