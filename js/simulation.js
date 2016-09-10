$(document).ready(function() {
  var data = null;
  // https://cmatskas.com/importing-csv-files-using-jquery-and-html5/
  // http://evanplaice.github.io/jquery-csv/examples/basic-usage.html
  // https://github.com/evanplaice/jquery-csv/

  // The event listener for the file upload
  $('#csvFileInput').change(upload);
  $('#startSimulationButton').click(runSimulation);
  $('#simulationResultsWrapper').hide();
  $('#simulationAreaWrapper').hide();

  // Method that checks that the browser supports the HTML5 File API
  function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      isCompatible = true;
    }
    return isCompatible;
  }

  // Method that reads and processes the selected file
  function upload(evt) {

    if (!browserSupportFileUpload()) {
      alert('The File APIs are not supported by this browser!');
    } else {

      var file = evt.target.files[0];
      var reader = new FileReader();
      reader.readAsText(file);
      reader.onerror = function() {
        alert('Unable to read ' + file.fileName);
      };

      reader.onload = function(event) {
        var csvData = event.target.result;
        data = $.csv.toObjects(csvData);
        if (data && data.length > 1) {
          $.each(data, function(index, row){
            cells = "<td>" + row.Task; + "</td>/n";
              cells += "<td>" + row.Max; + "</td>/n";
            cells += "<td>" + row.Min; + "</td>/n";
            cells += "<td>" + row.Confidence; + "</td>/n";
            $('#rawData table').append("<tr>" + cells+ "</tr>");
          });
          $('#simulationAreaWrapper').show();
        } else {
          alert('No data to import!');
        }
      };
    }
  }

  function runSimulation(evt) {
    var passes = parseInt($('#simulationPasses').val());
    var times = new Array(passes).fill(0);
    var min = -1;
    var max = 0;
    $('#simulationResultsWrapper').show();
    for(var i = 0; i < passes; i++) {
      var time = 0;
      $.each(data, function(index, row) {
        time += generateEstimate(row.Min, row.Max, row.Confidence);
      });
      times[time]++;
      if (time < min || min == -1) { min = time; }
      if (time > max) { max = time;}
      cells = "<td>" + i + "</td>\n";
      cells += "<td>" + time + "</td>\n";
      $('#simulationResultsWrapper table').append("<tr>" + cells + "</tr>");
    }
    var sums = times.map(function(value, index) {
      return value * index;
    });
    var sum = sums.reduce(function(a, b) { return a + b; });
    var avg = sum / sums.length;
    $("#simulationAverage").html('Average Time: ' + avg);
    $("#simulationMax").html('Max Time: ' + max);
    $("#simulationMin").html('Min Time: ' + min);

    // build histogram from times array
    buildHistogram(times, min, max);

  }

  function generateEstimate(minimum, maximum, confidence){
    var max = parseInt(maximum);
    var min = parseInt(minimum);
    var base = getRandom(1,1000);
    var boundry = confidence * 1000;
    var midBoundry = Math.floor((1000 - boundry)/2);
    var range = max - min + 1;

    if (base < boundry) {
      return (base % range) + min;
    }

    if (base < midBoundry) {
      return (base % min);
    }

    return (base % max) + max;

  }

  function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function buildHistogram(list, min, max) {
    var minbin = min;
    var maxbin = max;
    var numbins = maxbin - minbin;

    // whitespace on either side of the bars in units of MPG
    var binmargin = .2;
    var margin = {top: 10, right: 30, bottom: 50, left: 60};
    var width = 450 - margin.left - margin.right;
    var height = 250 - margin.top - margin.bottom;

    // Set the limits of the x axis
    var xmin = minbin - 1
    var xmax = maxbin + 1

    // This scale is for determining the widths of the histogram bars
    var x = d3.scale.linear()
	  .domain([0, (xmax - xmin)])
	  .range([0, width]);

    // Scale for the placement of the bars
    var x2 = d3.scale.linear()
	  .domain([xmin, xmax])
	  .range([0, width]);

    var y = d3.scale.linear()
	  .domain([0, max])
	  .range([height, 0]);

    var xAxis = d3.svg.axis()
	  .scale(x2)
	  .orient("bottom");
    var yAxis = d3.svg.axis()
	  .scale(y)
	  .ticks(8)
	  .orient("left");

    // put the graph in the "mpg" div
    var svg = d3.select("#histoGram").append("svg")
	  .attr("width", width + margin.left + margin.right)
	  .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	  .attr("transform", "translate(" + margin.left + "," +
						margin.top + ")");

    // set up the bars
    var bar = svg.selectAll(".bar")
	  .data(list)
	  .enter().append("g")
	  .attr("class", "bar")
	  .attr("transform", function(d, i) { return "translate(" +
	       x2(i + minbin) + "," + y(d) + ")"; });

    // add rectangles of correct size at correct location
    bar.append("rect")
	  .attr("x", x(binmargin))
	  .attr("width", x( 2 * binmargin))
	  .attr("height",  function(d) { return height - y(d); });

    // add the x axis and x-label
    svg.append("g")
	  .attr("class", "x axis")
	  .attr("transform", "translate(0," + height + ")")
	  .call(xAxis);
    svg.append("text")
	  .attr("class", "xlabel")
	  .attr("text-anchor", "middle")
	  .attr("x", width / 2)
	  .attr("y", height + margin.bottom)
	  .text("Hours");

    // add the y axis and y-label
    svg.append("g")
	  .attr("class", "y axis")
	  .attr("transform", "translate(0,0)")
	  .call(yAxis);
    svg.append("text")
	  .attr("class", "ylabel")
	  .attr("y", 0 - margin.left) // x and y switched due to rotation
	  .attr("x", 0 - (height / 2))
	  .attr("dy", "1em")
	  .attr("transform", "rotate(-90)")
	  .style("text-anchor", "middle")
	  .text("Frequency");
  }
});
