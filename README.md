Interactive UK Map with D3.js
=============================

Project Overview
----------------

This project creates an interactive web-based map of the UK and the Isle of Man using D3.js. The map features dynamic town plotting, distance measurement between towns, and comprehensive geographical statistics. It is designed for data exploration and GIS applications.

Goal
----

The primary goal is to develop an interactive map that:

-   Plots towns dynamically based on a data feed.
-   Measures and visualizes distances between towns.
-   Provides detailed statistics and geographical information about UK counties.

Requirements
------------

-   Dynamic plotting of towns on an SVG map of the UK and Isle of Man.
-   Measurement functionality to visualize distances between any two towns using the Haversine formula.
-   Interactive elements including tooltips and a slider to control town plotting.
-   Data export in CSV and JSON formats.
-   Support for local serving of the map due to CORS restrictions.

Solution
--------

### Architecture

-   **Map Visualization:** Utilizes D3.js and TopoJSON libraries.
-   **Data Sources:**
    -   `uk.json` and `isle-of-man.geo-json` for plotting features and boundaries.
    -   `ukcounties.json` for county statistics.
-   **Measurement:** Employs the Haversine formula to calculate distances between towns.
-   **Data Export:** Provides functionality to download measurement data in CSV or JSON formats.
-   **Interactivity:**
    -   **Slider:** Controls the number of towns plotted from the data feed.
    -   **Tooltips:** Display town information on hover or click; show distance between towns in measurement mode.
    -   **Animations:** Uses easeLinear transitions for plotting towns and distance visualization.

### Map Features

-   **Plotting Towns:** The "Plot New Towns" button replots towns dynamically.
-   **Distance Measurement:** Visualizes distances with stroke and stroke-width using easeLinear transitions.
-   **County Statistics:** Displays statistics for each origin of counties (Eng, Sco, NIR, Wal, IoM) integrated with `ukcounties.json`.
-   **Slider Control:** Allows users to adjust the number of towns plotted from the feed.

### Optimizations

-   **Efficient Data Handling:** Optimized data processing to handle large datasets smoothly.
-   **Smooth Animations:** Implemented easeLinear transitions for smooth visual effects.
-   **Data Export:** Enhanced data export functionality for easier analysis and integration with other GIS tools.

### Core Files

-   **map.js:** Contains the core functionality for map interactions and data plotting.
-   **map.css:** Handles styling and visual presentation of the map.
-   **map.html:** Serves as the entry point and needs to be served locally due to CORS restrictions. Use tools like Python HTTP server, http-server, live server, or PHP server in VSCode for local serving.
