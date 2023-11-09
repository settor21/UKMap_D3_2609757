//Global variables, useful for reusing created elements when page is loaded
let svg, projection, townData, selectedPoints = 0; // reusable components for plotting and working with points
let startPoint, measurementLine, isMeasurementEnabled = false; // flags for measurement mode
let labels,sliderValue,mapGroup,zoom; // AJAX-like dynamic variables
let activeLabel = null; // To keep track of the active point for the tooltip
//1-5
/* 
This function plots the Isle of Man,as it was not included in the uk.json
Source: https://github.com/codeforgermany/click_that_hood/blob/main/public/data/isle-of-man.geojson
*/  
function plotIsleOfMan() {
  d3.json("isle-of-man.geojson").then((isleOfMan) => {
    //load the isle of man geojson using d3.json + streaming callback
    //create an svg for the map, and use variable for reference later
    const isleOfManGroup = svg.append("g").attr("class", "isle-of-man");
    const path = d3.geoPath().projection(projection); // path generator to implement the map
    //data binding for json coordinates
    isleOfManGroup
      .selectAll(".isle-of-man-feature")
      .data(isleOfMan.features)
      .enter()
      .append("path").attr("class", "isle-of-man-feature").attr("d", path)
      .style("fill", "#9ccea9");
    //Isle of Man label
    isleOfManGroup
      .append("text").attr("class", "isle-of-man-label")
      .attr("transform", `translate(${projection([-4.6, 54.15])})`) //position of isle of man relative to uk
      .attr("dy", "-1em") //vertical label adjustment
      .style("font-size", "20px").style("fill", "#777") //label color.style("fill-opacity", 0.8)
      .style("text-anchor", "middle").text("IoM");
  });
}

/*
  This function draws the uk map and isle of man using TOPOJSON and d3
  Height is a variable to match the height of the user's screen
  Source: https://gist.githubusercontent.com/henryjameslau/3afaec1d4a69fd873fce377c884e87ec/raw/9ea778f668955c7ef44b504aaf004ca015ba9429/uk.json
*/
function drawUKMap(height) {
  const width = 600; 
  //define project ion of map, its center, axis, scale factor
  projection = d3.geoAlbers().center([0, 54.4]).rotate([4.4, 0])
    .scale(2700)
    .translate([width / 2, height / 2]); //transalate to center of SVG
  
  const mapDiv = d3.select("#ukmap");
  svg = mapDiv // svg for containing map based on specified height
    .append("svg").attr("class", "drawnMap")
    .attr("width", width).attr("height", height).style("background-color", "#76b6c4");
  

  const mapGroup = svg.append("g");
  const path = d3.geoPath().projection(projection);

  d3.json("uk.json").then((uk) => { //load map data from uk.json with callback
    const features = topojson.feature(uk, uk.objects.subunits); //feature conversion using topojson
    features.features = features.features.filter((d) => d.id !== "IRL"); //draw all map features except ireland

    const featureSelection = mapGroup //render feature
      .selectAll(".feature")
      .data(features.features).enter().append("path")
      .attr("class", (d) => "feature " + d.id) // json file has country names using id
      .attr("d", path).style("fill", "#9ccea9");
    
    mapGroup //render boundary
      .append("path")
      .datum( //d3 function to bind data to path element created above
        topojson.mesh( //mesh/path for boundary i.e. topojson.mesh(topology, object, filter)
          uk, uk.objects.subunits, //map data and collection of map features(TOPOJSON)
          (a, b) => a !== b && a.id !== "IRL") //filter function to filter ireland out
      ) //
      .attr("d", path).attr("class", "boundary");

    //labelling map based on properties key-value pair found in json
    const labelSelection = mapGroup
      .selectAll(".label").data(features.features).enter() 
      .append("text").attr("class", (d) => "label " + d.id)
      .attr("transform", (d) => "translate(" + path.centroid(d) + ")")
      .attr("dy", ".35em").text((d) => d.id);
    
    plotIsleOfMan(); // plot isle of man too
  });
}

//  This function plots the points from the feed
function plotPoints() {
  if (!townData) { //check if feed was saved to the global variable
    console.log("Town data not available");
    return;
  }
  svg.select(".points").remove(); //remove all previously plotted points

  countCountiesByCountry(townData); //determine the number of counties for towns in this feed
  const pointGroup = svg.append("g").attr("class", "points");
 

  const points = pointGroup //plot points from town data as circles
    .selectAll(".town-point").data(townData)
    .enter()
    .append("circle").attr("class", "town-point")
    .attr("cx", (d) => projection([d.lng, d.lat])[0])
    .attr("cy", (d) => projection([d.lng, d.lat])[1])
    .attr("r", 3)
    .style("fill", "black").style("stroke", "white").style("stroke-width", 1.5);

  
  points
    .attr("r", 0)
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("r", 2);


  const labels = pointGroup
    .selectAll(".town-label").data(townData).enter()
    .append("text").attr("class", "town-label")
    .attr("x", (d) => projection([d.lng, d.lat])[0])
    .attr("y", (d) => projection([d.lng, d.lat])[1] - 8)
    .style("text-anchor", "middle").style("font-size", "10px").style("fill", "transparent")
    .each(function (d) { //implements for each point
      const lines = d3.select(this);
      lines //d3 variable for viewing town information
        .append("tspan")
        .text(d.Town + "," + d.Population + "," + d.County + "," +
          d.lat + "," + d.lng)
        .attr("x", (d) => projection([d.lng, d.lat])[0]).attr("dx", "-1em");
    });
  //details of selected point to be displayed on svg
  svg
    .append("text").attr("id", "townDetails")
    .attr("x", 0).attr("y", 320)
    .style("font-size", "14px").style("fill", "black")
    .text("");

  points.on("click", measurementTooltip);
  points.on("mouseover", standardTooltip);

  points.on("mouseout", function () {
    svg.selectAll(".town-details").remove();
    d3.select(this).transition().duration(200).attr("r", 2.5); // Animate back to the original radius
  });
}

//this function  plot the points using the sliderValue as input.
//this will be called in updateTownCount
function consumeTownDataFeed(sliderValue) {
  const url = `http://34.38.72.236/Circles/Towns/${sliderValue}`;
  d3.json(url)
    .then((data) => {
      townData = data;
      plotPoints();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

//This function gets the slider value to update the count.
function updateTownCount() {
  const slider = document.getElementById("mapTownCount");
  const getValueButton = document.getElementById("getValueButton");
  const sliderValueDisplay = document.getElementById("sliderValue");
  slider.addEventListener("input", function () {
    const sliderValue = slider.value;
    sliderValueDisplay.textContent = `Towns to be plotted: ${sliderValue}`;
  });
  getValueButton.addEventListener("click", function () {
    svg.selectAll(".distance-line").remove(); //remove all measurement lines
    selectedPoints = 0; //reset point tracker for measurements
    d3.select("#downloadFormat").remove();
    d3.select("#downloadButton").remove();
    const sliderValue = slider.value; //get the slider value
    sliderValueDisplay.textContent = `Towns plotted: ${sliderValue}`;
    consumeTownDataFeed(sliderValue);
  });
}

//Enhancements
//this function implements tooltip and gets the coordinates for estimating distance between 2 points
function measurementTooltip() {
  if (isMeasurementEnabled) { //works only for measurement mode
    const cx = +d3.select(this).attr("cx"); //get x coordinate of point
    const label = d3.select(`text[class="town-label"][x="${cx}"]`); //find label of unique point
    if (label.node()) { //do the following to the found label
      d3.select(this).attr("r", 3.5);
    } else {
      d3.select(this).on("mouseout", function () {
        d3.select(this).attr("r",2.5);
      });    }

    const cy = +d3.select(this).attr("cy"); //get the y-coordinate
    const selectedTown = townData.find(
      (town) =>
        Math.round(projection([town.lng, town.lat])[0]) === Math.round(cx)
    ); //find the town using the screen coordinates
    
    //Tracking sequence for measuring 2 points
    selectedPoints++;  // increases when town is found
    if (selectedPoints === 1) {
      startPoint = [cx, cy]; //saves as starting point
      svg.selectAll(".measurement-details").remove(); //clear old measurement first
      svg.selectAll(".distance-line").remove();
      // Create and position text elements
      svg
        .append("text")
        .attr("class", "measurement-details")
        .attr("x", 0).attr("y", 200)
        .text(`Starting point: `+ selectedTown.Town );

    } else if (selectedPoints === 2) {
      const currentPoint = [cx, cy];
      if (
        startPoint[0] !== currentPoint[0] &
        startPoint[1] !== currentPoint[1]
      ) { //prevents the same point from being measured twice
        svg
          .append("text")
          .attr("class", "measurement-details")
          .attr("x", 0)
          .attr("y", 220)
          .text(`End point: ` + selectedTown.Town);
        calculateAndDrawDistance(startPoint, currentPoint);
      } else {
        selectedPoints = 1; //keep new point as starting point
      }
    }
  }
}
//basic tooltip to display town information
function standardTooltip() {
  if (!isMeasurementEnabled) {
    const cx = +d3.select(this).attr("cx");
    const label = d3.select(`text[class="town-label"][x="${cx}"]`);

    if (label.node()) { // if label exists for point(transparent by default)
      if (activeLabel) { 
        activeLabel.style("fill", "transparent"); //hide label, svg will show data
      }
      d3.select(this).attr("r", 3.5);      
      activeLabel = label;// Set the active label to the current label
      //This section loads information about the town on the svg
      const labelText = label.text();
      const [Town, Population, County, Latitude, Longitude] =
        labelText.split(",");
      const pointProperties = [
        "Town",
        "Population",
        "County",
        "Latitude",
        "Longitude",
      ];
      //iteratively load feed values for the point
      const x = 0; // SVG x-coordinate
      let y = 320; // Initial y-coordinate
      for (const property of pointProperties) {
        const value = eval(property); // Get the corresponding value from the variables
        svg
          .append("text")
          .attr("class", "town-details")
          .attr("x", x)
          .attr("y", y)
          .text(`${property}: ${value}`);
        y += 17.5; // position the next piece of information below this
      }
    }
  }
}

//This function implements the Haversine formula to determine the distance between two coordinates
// source: https://www.geeksforgeeks.org/haversine-formula-to-find-distance-between-two-points-on-a-sphere/
function calculateDistance(coord1, coord2) {
  const [lat1, lon1] = coord1.map((deg) => (deg * Math.PI) / 180);
  const [lat2, lon2] = coord2.map((deg) => (deg * Math.PI) / 180);
  const earthRadius = 6371;
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance;
}

// this function displays the distance on the svg implements the distance line animation
function calculateAndDrawDistance(start, end) {
  const distance = calculateDistance(start, end);
  svg.append("text").attr("class", "measurement-details")
    .attr("x", 0).attr("y", 240)
    .text(`Distance between them: ` + distance.toLocaleString('en-UK')+' km');
  const path = svg
    .append("path")
    .attr("class", "distance-line").style("stroke", "black").style("stroke-width", 2.5)
    .style("fill", "none")
    .attr("d", () => {
      const [x1, y1] = end;
      const [x2, y2] = start;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy);
      return `M${x1},${y1}A${dr},${dr} 0 0,1 ${x2},${y2}`; //line path
    });

  const length = path.node().getTotalLength();
  path //animation for distance between two points
    .attr("stroke-dasharray", 5, 5)
    .attr("stroke-dashoffset", length).transition().ease(d3.easeLinear).duration(4000).attr("stroke-dashoffset", 1);
  selectedPoints = 0; //reset to get a new point
  
}

//This function is used to convert the distances calculated between all points for the current json feed 
// into a csv file
function convertJSONToCSV(data) {
  const header = Object.keys(data[0]).join(",");
  const csv = data.map((row) =>
    Object.values(row)
      .map((value) => JSON.stringify(value))
      .join(",")
  );
  return [header, ...csv].join("\n");
}
//This function allows the user to download all distances between towns asjson
function downloadJSON(data) {
  const jsonOutput = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonOutput], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "town_distances.json";
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
//This function allows the user to download all distances between towns as csv
function downloadCSV(data) {
  const csvOutput = convertJSONToCSV(data);

  const blob = new Blob([csvOutput], { type: "text/csv" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "town_distances.csv";
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
//this function finds the country of origin for counties plotted and displays them in the svg
function countCountiesByCountry(townData) {
  let englandCount = 0;
  let scotlandCount = 0;
  let northernIrelandCount = 0;
  let walesCount = 0;
  let isleOfManCount = 0;

  d3.json("ukcounties.json")
    .then((ukCounties) => {
      townData.forEach((town) => {
        let countyMatched = false; //set flag before check
        for (const countryName in ukCounties) { 
          const counties = ukCounties[countryName]; //get a country in the json
          for (const county of counties) { //check the list of counties
            if (town.County.includes(county)) { //if the town county is in the ukcounties.json...
              if (countryName === "England") {
                englandCount++;
              } else if (countryName === "Scotland") {
                scotlandCount++;
              } else if (countryName === "Wales") {
                walesCount++;
              } else if (countryName === "Northern Ireland") {
                northernIrelandCount++;
              } else if (countryName === "Isle of Man") {
                isleOfManCount++;
              }
              countyMatched = true;
              break;
            }
          }
        }

        if (!countyMatched) {
          console.log(`County not found in ukcounties.json: ${town.County}`);
        }
      });

      //This section displays the results of the count
      svg.selectAll(".county-count").remove();
      const countryCounts = [ 
        { name: "England", count: englandCount },
        { name: "Scotland", count: scotlandCount },
        { name: "Wales", count: walesCount },
        { name: "Northern Ireland", count: northernIrelandCount },
        { name: "Isle of Man", count: isleOfManCount },
      ];

      let y = 450; //initial position for england
      svg.append("text").attr("class", "county-count").attr("x", 5).attr("y", y - 20).text("Counties plotted");

      countryCounts.forEach((country) => { //load all country names and number of counties plotted for this iteration
        y += 15;
        svg
          .append("text").attr("class", "county-count").attr("x", 5) .attr("y", y)
          .text(`${country.name}: ${country.count}`);
      });

      const totalCount = countryCounts.reduce((total, country) => total + country.count, 0); //add up all the counts
      y += 15;
      svg
        .append("text")
        .attr("class", "county-count")
        .attr("x", 5).attr("y", y).text(`Total: ${totalCount}`);
    })
    .catch((error) => {
      console.error("Error loading JSON data:", error);
    });
}
window.onload = function () { //function to call defined functions and implement other js  when window is loaded/refreshed
  //window height configuration for client device
  const windowHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight;
  const height = windowHeight - 89;

  drawUKMap(height); //draw relevant map features
  updateTownCount(); //check slider value
  consumeTownDataFeed(50); //get feed with default of 50

  document.getElementById("getAllDistances").addEventListener("click", () => {
    if (!townData) {
      console.log("Town data not available.");
      return;
    }

    const distances = [];

    for (let i = 0; i < townData.length; i++) {
      for (let j = i + 1; j < townData.length; j++) {
        const town1 = townData[i];
        const town2 = townData[j];

        const distance = calculateDistance(
          [town1.lat, town1.lng],
          [town2.lat, town2.lng]
        );

        const distanceData = {
          Town1: town1.Town,
          Latitude1: town1.lat,
          Longitude1: town1.lng,
          Town2: town2.Town,
          Latitude2: town2.lat,
          Longitude2: town2.lng,
          "Distance(km)": distance,
        };

        distances.push(distanceData);
      }
    }

    const formatOptions = ["CSV", "JSON","Both"];
    d3.select("body")
      .append("select")
      .attr("id", "downloadFormat")
      .selectAll("option")
      .data(formatOptions)
      .enter()
      .append("option")
      .text((d) => d)
      .attr("value", (d) => d);

    d3.select("body")
      .append("button")
      .attr("id", "downloadButton")
      .text("Download")
      .on("click", function () {
        const selectedFormat = d3.select("#downloadFormat").property("value").toLowerCase();
        if (selectedFormat === "csv") {
          downloadCSV(distances);
        } else if (selectedFormat === "json") {
          downloadJSON(distances);
        } else if (selectedFormat === "both") {
          downloadJSON(distances);
          downloadCSV(distances);
        }
        else {
          console.log("Invalid format choice.");
        }
        d3.select("#downloadFormat").remove();
        d3.select("#downloadButton").remove();
      });
  });

  const measurementToggleButton = d3.select("#measurementToggle");

  measurementToggleButton.on("click", function () {
    isMeasurementEnabled = !isMeasurementEnabled;
    measurementToggleButton.text(() =>
      isMeasurementEnabled
        ? "Disable Measurement Mode"
        : "Enable Measurement Mode"
    );
    if (isMeasurementEnabled) {
      alert(
        "Hover is disabled in measurement mode. Click any two points to visualize the distance between them"
      );
    } else {
      svg.selectAll(".distance-line").remove();
      alert("Hover is enabled in standard mode");
      
    }
  });
};
