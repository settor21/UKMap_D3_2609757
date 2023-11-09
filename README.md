This project utilizes D3.js to craft an interactive web-based UK map with features like plottable towns, measurement mode, and a distance visualization. Leveraging D3.js and TopoJSON libraries, the map draws data from a feed, plotting towns dynamically on the SVG of the UK and Isle of Man Map. This map was plotted by plotting features and boundaries using the values from uk.json and isle-of-man.geo-json. The "Plot New Towns" button replots a new set of towns when clicked. 

Enhancements include the use of the Haversine formula in measurement mode, allowing users to visualize geographical distances between towns. Measurement mode visualised this distance using stroke and stroke-width with the easeLinear transition type. This data can be downloaded in CSV or JSON formats, fostering data exploration and GIS applications.

Another key addition is the ukcounties.json file, containing comprehensive UK county information. Integrated with townData, it identifies the native countries of counties, displaying statistics for each origin (Eng, Sco, NIR, Wal, IoM) of plotted counties each time the map or points are replotted.

A slider was also added to control the number of towns that could be plotted from the feed. This enhancement allowed for greater control of the feed url and to access a wide range of towns in the UK. 

The towns are also animated using the easeLinear transition when plotted. 

Finally, tooltip functions were implemented for standard and measurement mode, with the former displaying all information about the town from the feed upon hover/mouseover while the latter displays two towns and the distance between them in kilometres(km) when they are clicked on.

The core functionality resides in map.js, styling in map.css, and content in map.html. Due to CORS, serving map.html is necessary for accessing and plotting points from the feed. you can use Python HTTP server, http-server, live server, or PHP server in VSCode to serve locally.
