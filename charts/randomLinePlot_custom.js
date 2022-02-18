/**
 * Reusable and updatable randomized line plot.
 * 
 * @author Timothy Esler
 * @since  2019.01.14
 * @summary  Reusable and updatable randomized line plot.
 * @requires d3.v4.js
 * @class
 * 
 * @example
 * var chart = randomLinePlot(); // instantiate the chart
 * 
 * // update settings
 * chart.width(1000).height(1000);
 * 
 * // render the chart with data
 * d3.select("#chart")
 * 	    .call(chart.data(data));
 * 
 * @returns Chart function.
 */
function randomLinePlot() {
	var width = 800,
        height = 800,
        lineColor = "steelblue",
        lineLabels = ["CPU", "memory", "disk", "received", "sent"],
        doPlay = false,
        showLine = 1,
        showBar = 0,
        showNN = 0,
        changeVisibility = false,
        rescale = false,
        duration = 100,
        randomDecay = 1,
        updateData,
        playAnimation,
        updateColor,
        updateDimensions,
        colorScale = ['rgb(85,151,196)', 'rgb(253,157,72)', 'rgb(94,181,94)', 'rgb(222,91,91)', 'rgb(172,139,203)'];

	/**
	 * Function to render the chart.
	 * @public
	 * @param {selection} selection - The div ID in which to render the chart
	 */
    function chart(selection) { selection.each(function()
    {
        // Define random starting data
        var priorY = d3.range(5).map(function(d) { return d + 0.5; }),
            alpha = d3.range(5).map(function() { return Math.random() * 0.2 + 0.1; }),
            maxes = d3.range(5).map(function() { return Math.random() / 2; }),
            new_d = {};
        
        var data = d3.range(25).map(
            function(d) {
                new_d = {
                    id: d,
                    x: d,
                    y0: Math.max(0, alpha[0] * (0 + (Math.random() - maxes[0]) / (1 - maxes[0]) - priorY[0]) + priorY[0]),
                    y1: Math.max(1, alpha[1] * (1 + (Math.random() - maxes[1]) / (1 - maxes[1]) - priorY[1]) + priorY[1]),
                    y2: Math.max(2, alpha[2] * (2 + (Math.random() - maxes[2]) / (1 - maxes[2]) - priorY[2]) + priorY[2]),
                    y3: Math.max(3, alpha[3] * (3 + (Math.random() - maxes[3]) / (1 - maxes[3]) - priorY[3]) + priorY[3]),
                    y4: Math.max(4, alpha[4] * (4 + (Math.random() - maxes[4]) / (1 - maxes[4]) - priorY[4]) + priorY[4])
                };
                priorY = [
                    new_d.y0,
                    new_d.y1,
                    new_d.y2,
                    new_d.y3,
                    new_d.y4
                ];
                return new_d;
            }
        );

        // Define size and margins
        var xScale, yScale, 
            currentID = 24;
            
        updateDimensions = function()
        {
            xScale = d3.scaleLinear()
                .range([0, width])
                .domain([currentID - 23, currentID + 6]);
            yScale = d3.scaleLinear()
                .range([height, 0])
                .domain([-2, 5.5]);
            
            selection
                .attr('width', width + 'px')
                .attr('height', height + 'px');
        }

        updateDimensions();

        // Create grouping for chart
        var svg_g = selection
            .append("g")
            .attr("class", "line_container");
        
        // Create chart layers
        var bar_g = svg_g.append("g").attr("class", "bar_g").style("opacity", showBar),
            line_g = svg_g.append("g").attr("class", "line_g").style("opacity", showLine),
            nn_g = svg_g.append("g").attr("class", "nn_g").style("opacity", showNN);

        // Add line labels        
        var labels = line_g.append("g")
            .attr("class", "label_g")
            .selectAll(".label")
            .data(d3.range(5))
            .enter()
            .append("text")
            .attr("class", "label")
            .style("font-size", "calc(5px + 1vw)")
            .style("font-family", "Lato, sans-serif")
            .style("font-weight", 400)
            .style("fill", "rgba(0, 0, 0, 0.5)")
            .text(function(d) { return lineLabels[d]; });
        
        var valueline = d3.line().x(function(d) { return xScale(d.x); }).y(function(d) { return yScale(d.y); });
            
        // Add bar chart base
        var base_bar = bar_g.append("rect").style("fill", "rgb(100, 100, 100)");

        var bars = bar_g.selectAll(".bar")
            .data(d3.range(5))
            .enter()
            .append("rect")
            .attr("class", "bar")
            .style("fill", function(d) { return colorScale[d]; })
            .style("opacity", 1)
            .attr("r", 4);

        // Add NN components
        var node_1_g = nn_g.append("g").attr("class", "node_1_g"),
            node_2_g = nn_g.append("g").attr("class", "node_2_g"),
            node_3_g = nn_g.append("g").attr("class", "node_3_g"),
            path_1_g = nn_g.append("g").attr("class", "path_1_g"),
            path_2_g = nn_g.append("g").attr("class", "path_2_g");

        var node_1 = node_1_g.selectAll(".node_1")
            .data(d3.range(5))
            .enter()
            .append("circle")
            .attr("class", "node_1")
            .attr("fill", function(d) { return colorScale[d]; })
            .attr("r", 30);
        
        var pie = d3.pie().sort(null).value(function(d, i) { return d; }),
            arc = d3.arc().outerRadius(30).innerRadius(0);

        var weightData_2 = [
                [1, 10, 10, 0, 3],
                [3, 3, 2, 3, 5],
                [0, 0, 4, 3, 2],
                [1, 2, 6, 5, 4]
            ],
            weightData_3 = [
                [1, 3, 0, 3, 0],
                [1, 0, 4, 0, 0],
                [1, 1, 0, 1, 3]
            ];
                
        for (let j = 0; j < 4; j++)
        {   
            node_2_g.selectAll(".node_2_" + j)
                .data(pie(data.slice(j * 5, j * 5 + 5)))
                .enter()
                .append("path")
                .attr("class", "node_2_" + j)
                .style("fill", function(d, i) { return colorScale[i]; });
        }
            
        for (let j = 0; j < 3; j++)
        {   
            node_3_g.selectAll(".node_3_" + j)
                .data(pie(data.slice(j * 6, j * 6 + 5)))
                .enter()
                .append("path")
                .attr("class", "node_3_" + j)
                .style("fill", function(d, i) { return colorScale[i]; });
        }

        var nn_valueline = d3.line().x(function(d) { return d.x; }).y(function(d) { return d.y; });
        
        for (let j = 0; j < 5; j++)
        {
            for (let i = 0; i < 4; i++)
            {
                path_1_g.append("path")
                    .attr("class", "path_1_" + j + "_" + i)
                    .style("stroke", colorScale[j]);
            }
        }
        for (let j = 0; j < 4; j++)
        {
            for (let i = 0; i < 3; i++)
            {
                path_2_g.append("path")
                    .attr("class", "path_2_" + j + "_" + i)
                    .style("stroke", "darkgrey");
            }
        }
        
        function updateData(el)
        {
            if (!doPlay) return;

            if (!showNN) randomDecay = 1;
            else randomDecay = Math.max(randomDecay * 0.99, 0.2);
            
            // Update data
            currentID++;
            if (Math.random() < 0.02)
            {
                alpha = d3.range(5).map(function() { return Math.random() * 0.2 + 0.1; });
                maxes = d3.range(5).map(function() { return Math.random() / 2; });
            }

            new_data = data.map(function(d) {
                var out = {};
                Object.assign(out, d);
                return out;
            });
            data = new_data;
            data.shift();
            data.pop();
            new_d = {
                id: currentID,
                x: currentID,
                y0: Math.max(0, alpha[0] * (0 + (Math.random() - maxes[0]) / (1 - maxes[0]) - priorY[0]) + priorY[0]),
                y1: Math.max(1, alpha[1] * (1 + (Math.random() - maxes[1]) / (1 - maxes[1]) - priorY[1]) + priorY[1]),
                y2: Math.max(2, alpha[2] * (2 + (Math.random() - maxes[2]) / (1 - maxes[2]) - priorY[2]) + priorY[2]),
                y3: Math.max(3, alpha[3] * (3 + (Math.random() - maxes[3]) / (1 - maxes[3]) - priorY[3]) + priorY[3]),
                y4: Math.max(4, alpha[4] * (4 + (Math.random() - maxes[4]) / (1 - maxes[4]) - priorY[4]) + priorY[4])
            }
            priorY[0] = new_d.y0;
            priorY[1] = new_d.y1;
            priorY[2] = new_d.y2;
            priorY[3] = new_d.y3;
            priorY[4] = new_d.y4;
            data.push(new_d);
            data.push(
                {
                    id: currentID + 1,
                    x: currentID,
                    y0: new_d.y0,
                    y1: new_d.y1,
                    y2: new_d.y2,
                    y3: new_d.y3,
                    y4: new_d.y4
                }
            );

            xScale.domain([xScale.domain()[0] + 1, xScale.domain()[1] + 1]);
            
            // Define visibility
            if (changeVisibility)
            {
                line_g.transition().duration(duration).ease(d3.easeLinear).style("opacity", showLine);
                bar_g.transition().duration(duration).ease(d3.easeLinear).style("opacity", showBar);
                nn_g.transition().duration(duration).ease(d3.easeLinear).style("opacity", showNN);
                changeVisibility = false;
            }

            // Line elements
            var line_n_g = line_g.selectAll(".line_n_g").data(data, function(d) { return d.id; });

            line_n_g.exit().remove();

            var line_n_g_enter = line_n_g
                .enter()
                .append("g")
                .attr("class", "line_n_g");
            
            for (let j = 0; j < 5; j++)
            {
                line_n_g_enter
                    .append("path")
                    .attr("class", "line line_" + j)
                    .style("stroke", lineColor)
                    .style("stroke-width", '2px');
                
                line_n_g_enter
                    .merge(line_n_g)
                    .each(
                        function(d, i) {
                            d3.select(this)
                                .select(".line_" + j)
                                .datum(function (d) {
                                    return data.slice(i-1, i+1).map(function(d) {
                                        return { id: d.id, x: d.x, y: d['y' + j] };
                                    });
                                })
                        }
                    );
            }

            line_n_g_enter.merge(line_n_g)
                .selectAll(".line")
                .transition().duration(duration).ease(d3.easeLinear)
                .style("opacity", function(d) { 
                    if (d.length > 0)
                        return Math.max(0, Math.pow((d[0].x - currentID + 24) / 55, 0.75));
                    else return 1;
                })
                .attr("d", valueline);
            
            var point_data = data.slice(-1);
            var circle_g = line_g.selectAll(".line_end_g").data(point_data);
            var circle_g_enter = circle_g
                .enter()
                .append("g")
                .attr("class", "line_end_g");
    
            labels
                .attr("x", xScale(currentID + 2))
                .attr("y", function(d) { return yScale(d + 0.35); });

            for (let j = 0; j < 5; j++)
            {
                circle_g_enter
                    .append("circle")
                    .attr("class", "line_end line_end_" + j)
                    .style("fill", lineColor)
                    .attr("r", 4);

                circle_g_enter.merge(circle_g)
                    .select(".line_end_" + j)
                    .transition().duration(duration).ease(d3.easeLinear)
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d["y" + j]); });
            }

            // Bar elements
            var bars_trans = bars.data([point_data[0].y0, point_data[0].y1, point_data[0].y2, point_data[0].y3, point_data[0].y4])
                .transition().duration(duration).ease(d3.easeLinear)
                .attr("x", xScale(currentID + 1.25))
                .attr("width", function(d, i) { return (xScale(d - i) - xScale(0)) * 17.5 * showBar; });
                
            if (rescale)
            {
                base_bar
                    .attr("x", xScale(currentID + 1))
                    .attr("y", yScale(5.2))
                    .attr("width", xScale(0.25) - xScale(0))
                    .attr("height", yScale(0) - yScale(5.5));
                
                bars_trans
                    .attr("y", function(d, i) { return yScale(i + 0.8); })
                    .attr("height", yScale(0) - yScale(0.7));
            }

            // NN elements
            if (rescale)
            {
                node_1
                    .attr("cx", xScale(currentID + 17.5))
                    .attr("cy", function(d) { return yScale(d + 0.45); });
            }

            for (let j = 0; j < 4; j++)
            {   
                node_2_g.selectAll(".node_2_" + j)
                    .data(
                        pie(d3.range(5).map(function(d, i) { 
                            return Math.random() * randomDecay + weightData_2[j][i] * (1 - randomDecay); 
                        }))
                    )
                    .attr("d", arc)
                    .attr("transform", "translate(" + xScale(currentID + 30) + "," + yScale(j + 0.95) + ")");
            }

            for (let j = 0; j < 3; j++)
            {   
                node_3_g.selectAll(".node_3_" + j)
                    .data(
                        pie(d3.range(5).map(function(d, i) { 
                            return Math.random() * randomDecay + weightData_3[j][i] * (1 - randomDecay); 
                        }))
                    )
                    .attr("d", arc)
                    .attr("transform", "translate(" + xScale(currentID + 42.5) + "," + yScale(j + 1.45) + ")");
            }

            for (let j = 0; j < 5; j++)
            {
                for (let i = 0; i < 4; i++)
                {
                    if (rescale)
                        path_1_g.select(".path_1_" + j + "_" + i)
                            .data([[
                                {x: xScale(currentID + 17.5) + 30, y: yScale(j + 0.45)},
                                {x: xScale(currentID + 30) - 30, y: yScale(i + 0.95)}
                            ]])
                            .attr("d", function(d) { return nn_valueline(d); })
                            .style("stroke-width", (point_data[0]["y" + j] - j) * 4 + 0.5);
                    
                    else
                        path_1_g.select(".path_1_" + j + "_" + i)
                            .style("stroke-width", (point_data[0]["y" + j] - j) * 4 + 0.5);
                }
            }
            for (let j = 0; j < 4; j++)
            {
                var lineW = Math.random() * 2 + 1;
                for (let i = 0; i < 3; i++)
                {
                    if (rescale)
                        path_2_g.select(".path_2_" + j + "_" + i)
                            .data([[
                                {x: xScale(currentID + 30) + 30, y: yScale(j + 0.95)},
                                {x: xScale(currentID + 42.5) - 30, y: yScale(i + 1.45)}
                            ]])
                            .attr("d", function(d) { return nn_valueline(d); })
                            .style("stroke-width", lineW);

                    else
                        path_2_g.select(".path_2_" + j + "_" + i)
                            .style("stroke-width", lineW);
                }
            }

            rescale = false;
        }

        svg_g
            .transition().duration(duration).ease(d3.easeLinear)
            .call(updateData);

        playAnimation = function()
        {
            if (doPlay)
                svg_g
                    .transition().duration(duration).ease(d3.easeLinear)
                    .call(updateData)
                    .on("end", playAnimation);
            else
                svg_g.transition().duration(0)
            
            duration = 100;
        }

        updateColor = function(duration = 0)
        {
            var lines = svg_g.selectAll(".line");
            if (duration > 0) lines = lines.transition().duration(duration).ease(d3.easeLinear);
            lines.style("fill", lineColor).style("stroke", lineColor);
        }
    })}

	chart.width = function(value) {
		if (!arguments.length) return width;
        width = value;
        rescale = true;
        if (typeof updateDimensions === 'function') updateDimensions();
		return chart;
	};

	chart.height = function(value) {
		if (!arguments.length) return height;
		height = value;
        rescale = true;
        if (typeof updateDimensions === 'function') updateDimensions();
		return chart;
	};

	chart.margins = function(value) {
		if (!arguments.length) return margins;
		margins = value;
		return chart;
	};

	chart.nameColumn = function(value, duration = 1000) {
		if (!arguments.length) return nameColumn;
		nameColumn = value;
        if (typeof updateData === 'function') playAnimation();
		return chart;
	};

	chart.lineColor = function(value, duration = 1000) {
		if (!arguments.length) return lineColor;
        lineColor = value;
        if (typeof updateColor === 'function') updateColor(duration);
		return chart;
    };
    
    chart.playAnimation = function(value) {
        doPlay = value;
        duration = 100;
        if (typeof playAnimation === 'function') playAnimation();
		return chart;
    };

	chart.showElements = function(lineValue, barValue, nnValue) {
		if (!arguments.length) return showBar;
		showLine = lineValue;
		showBar = barValue;
		showNN = nnValue;
        duration = 1000;
        changeVisibility = true;
        if (typeof updateData === 'function') playAnimation();
		return chart;
	};

	return chart;
}