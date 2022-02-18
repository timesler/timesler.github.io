/**
 * Reusable and updatable 3 dimensional scatter plot.
 * 
 * @author Timothy Esler
 * @since  2018.10.14
 * @summary  Reusable and updatable 3 dimensional scatter plot.
 * @requires d3.v4.js
 * @class
 * 
 * @example
 * var chart = scatterPlot3d(); // instantiate the chart
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
function scatterPlot3d() {
	var width = 1000,
        height = 1000,
        margins = 30,
        xColumn = "x",
        yColumn = "y",
        zColumn = "z",
        nameColumn = "name",
        showNames = [],
        colColumn,
        circleColor = "steelblue",
        showPoints = true,
        spinPlot = false,
        spherification = 1,
        base_data = [{"x":0, "y": 0, "z": 1, "name": 'default'}],
        x_max,
        y_max,
        z_max,
        updateData,
        updateVisible,
        updateDimensions,
        updateColor,
        updateSpin,
        randomizeData,
        animateTrain,
        dragStarted,
        dragEnded,
        dragged;

	/**
	 * Function to render the chart.
	 * @public
	 * @param {selection} selection - The div ID in which to render the chart
	 */
    function chart(selection) { selection.each(function()
    {
        var current_scale = 1,
            current_rot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        
        // Define size and margins
        var margin = {top: margins, right: margins, bottom: margins, left: margins},
            width_axes = width - margin.left - margin.right,
            height_axes = height - margin.top - margin.bottom;
        
        var data = spherize(base_data, spherification);
        
        var data_random = base_data.map(
            function(d, i) {
                var out = {};
                Object.assign(out, d);
                out[xColumn] = Math.random() * 2 - 1;
                out[yColumn] = Math.random() * 2 - 1;
                out[zColumn] = Math.random() * 2 - 1;
                return out
            }
        );
        
        x_max = (x_max) ? x_max : d3.max(data, function(d) { return Math.abs(d[xColumn]); });
        y_max = (y_max) ? y_max : d3.max(data, function(d) { return Math.abs(d[yColumn]); });
        z_max = (z_max) ? z_max : d3.max(data, function(d) { return Math.abs(d[zColumn]); });
        
        var all_max = Math.max(x_max, y_max, z_max);
        
        // Define linear spatial transformations
        var xScale = d3.scaleLinear()
                .range([0, width_axes])
                .domain([-all_max * 1.1, all_max * 1.1]),
            yScale = d3.scaleLinear()
                .range([height_axes, 0])
                .domain([-all_max * 1.1, all_max * 1.1]),
            zScale = d3.scaleLinear()
                .range([2 * width_axes / 1100, 5 * width_axes / 1100])
                .domain([-all_max, all_max]),
            colScale = d3.scaleOrdinal(d3.schemeCategory10);
        
        // Define drag and zoom
        var drag = d3.drag()
            .on("drag", dragged)
            .on("start", dragStarted)
            .on("end", dragEnded);
        
        // Create grouping for chart and shift by margins
        var svg_g = selection
            .attr('width', width)
            .attr('height', height)
            .call(drag)
            .on("mousemove", directSpin)
            .append("g")
            .attr("class", "scatter_container")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        // Define tooltips
        var tooltip_bg = d3.color(circleColor);
        tooltip_bg.opacity = 0.75;
        var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")				
            .style("opacity", 0)
            .style("color", "black")
            .style("padding", "3px")
            .style("background", tooltip_bg)
            .style("border", "0px")
            .style("border-radius", "4px")
            .style("text-align", "left")
            .style("font", "14px sans-serif")
            .style("pointer-events", "none");
        
        updateDimensions = function()
        {
            width_axes = width - margin.left - margin.right;
            height_axes = height - margin.top - margin.bottom;

            xScale = d3.scaleLinear()
                .range([0, width_axes])
                .domain([-all_max * 1.1, all_max * 1.1]);
            yScale = d3.scaleLinear()
                .range([height_axes, 0])
                .domain([-all_max * 1.1, all_max * 1.1]);
            zScale = d3.scaleLinear()
                .range([2 * width_axes / 1100, 5 * width_axes / 1100])
                .domain([-all_max, all_max]);
            
            selection
                .attr('width', width)
                .attr('height', height)
            
            svg_g.transition().duration(0).call(rotate, current_rot, current_scale).on("end", spin);
        }

        updateVisible = function()
        {
            (showPoints) ? svg_g.selectAll(".circle").style("visibility", "visible") :
                svg_g.selectAll(".circle").style("visibility", "hidden");
        }

        updateData = function(duration = 1000, doSpherize = false, rot = current_rot, scale = current_scale)
        {
            if (doSpherize) data = spherize(base_data, spherification);

            // Define cirle elements
            var circles_g = svg_g.selectAll(".circle_g").data(data, function(d, i) { return d[nameColumn]; });

            circles_g.exit().remove();

            var circles_g_enter = circles_g
                .enter()
                .append("g")
                .attr("class", "circle_g");
            
            circles_g_enter
                .append("circle")
                .attr("class", "circle")
                .attr("id", function(d,i) { return i; })
                .style("stroke-width", "15px")
                .style("stroke-opacity", 0)
                .style("fill", function(d) { if (colColumn) {
                    return colScale(d[colColumn])} else {return circleColor} 
                })
                .style("stroke", function(d) { if (colColumn) {
                    return colScale(d[colColumn])} else {return circleColor} 
                })
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r",  2.5)
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
            
            circles_g.selectAll(".text").remove();
            if (showNames.length > 0)
                circles_g.filter(function(d) { return showNames.indexOf(d[nameColumn]) > -1; })
                    .append("text")
                    .attr("class", "text")
                    .text(function(d){ return d[nameColumn]; })
                    .style("fill", circleColor)
                    .style("font", "calc(10px + 0.2vmin) sans-serif")
                    .style("opacity", 0.5)
                    .attr("text-anchor", "middle") 
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("dy", -5);
            
            updateVisible();

            var sel_transition = svg_g;
            if (duration > 0) sel_transition = svg_g.transition().duration(duration).ease(d3.easeLinear);
            sel_transition = sel_transition.call(rotate, rot, scale).on("end", spin);
        }

        updateData();
        
        // Define tooltip behaviour
        function mouseover(d)
        {
            tooltip.style("opacity", .9);
            tooltip.html(d[nameColumn])
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 8) + "px");
            d3.select(this).style("fill", "lightblue");
        }
        function mouseout(d)
        {
            tooltip.style("opacity", 0);
            d3.select(this).style("fill", d3.select(this).style("stroke"));
        }

        var rot_spin = getRotation(-Math.PI / 1800, Math.PI / 1800);
        var spin_duration = 75;
        function spin()
        {
            if (spinPlot)
                svg_g.call(rotateTrans, matMul(current_rot, rot_spin), current_scale, spin_duration);
        }
        updateSpin = spin;

        function directSpin()
        {
            var cursor_x = xScale.invert(d3.event.offsetX),
                cursor_y = yScale.invert(d3.event.offsetY)
                atan_val = Math.atan2(cursor_x, cursor_y),
                spin_incr = Math.sqrt(Math.pow(cursor_x, 2) + Math.pow(cursor_y, 2)) * Math.PI / 450;
            rot_spin = getRotation(-spin_incr * Math.sin(atan_val), spin_incr * Math.cos(atan_val));
        }

        // Spherification of data points
        function spherize(data, s)
        {
            return data.map(function(e) {
                var shift = 1 - (1 - 
                    Math.sqrt(
                        Math.pow(e[xColumn], 2) +
                        Math.pow(e[yColumn], 2) +
                        Math.pow(e[zColumn], 2)
                    )
                ) * s;
                
                var out = {};
                Object.assign(out, e);
                out[xColumn] = out[xColumn] / shift;
                out[yColumn] = out[yColumn] / shift;
                out[zColumn] = out[zColumn] / shift;
                return out
            });
        }

        // Rotation functions
        function rotate_dim(d, rot, dim)
        {
            if (dim == 1)
                return rot[0] * d[xColumn] + rot[3] * d[yColumn] + rot[6] * d[zColumn];
            else if (dim == 2)
                return rot[1] * d[xColumn] + rot[4] * d[yColumn] + rot[7] * d[zColumn];
            else if (dim == 3)
                return rot[2] * d[xColumn] + rot[5] * d[yColumn] + rot[8] * d[zColumn];
        }

        function rotate(el, rot, scale)
        {
            if (timer) timer.stop();

            el.selectAll(".circle_g")
                .attr("transform", function(d) { 
                        return `translate(
                            ${xScale(rotate_dim(d, rot, 1) * scale)},
                            ${yScale(rotate_dim(d, rot, 2) * scale)}) scale(
                            ${zScale(rotate_dim(d, rot, 3)) * scale * 0.2}
                        )`;
                    }
                )
                .style("opacity",  function(d) { return rotate_dim(d, rot, 3) * 0.5 + 0.6; });
            
            current_rot = rot;
            current_scale = scale;

            return el;
        }

        var timer, p = 0;
        function rotateTrans(el, rot, scale, duration)
        {
            var tran_interp = [];
            var opac_interp = [];
            
            el.selectAll(".circle_g")
                .each(function (d) {

                    tran_interp.push(
                        d3.interpolateTransformSvg(
                            d3.select(this).attr("transform"),
                            `translate(
                                ${xScale(rotate_dim(d, rot, 1) * scale)},
                                ${yScale(rotate_dim(d, rot, 2) * scale)}
                            )
                            scale(
                                ${zScale(rotate_dim(d, rot, 3)) * scale * 0.2}
                            )`
                        )
                    );

                    opac_interp.push(
                        d3.interpolateNumber(
                            d3.select(this).style("opacity"),
                            Math.max(0, rotate_dim(d, rot, 3) * 0.5 + 0.6)
                        )
                    );
                })

            if (timer) timer.stop();
            
            p = 0;
            timer = d3.interval(
                function(elapsed)
                {  
                    if (!document[hidden]) p = elapsed / duration;

                    el.selectAll(".circle_g")
                        .attr("transform", function(d, i) { 
                                return tran_interp[i](p);
                            }
                        )
                        .style("opacity", function(d, i) { return opac_interp[i](p); });

                    if (elapsed >= duration)
                    {
                        if (p > 0)
                        {
                            current_rot = rot;
                            current_scale = scale;
                        }

                        timer.stop();
                        spin();
                        return true;
                    }
                },
                60
            )
        }

        function getRotation(angle_x, angle_y)
        {
            var cos_x = Math.cos(angle_x),
                sin_x = Math.sin(angle_x),
                cos_y = Math.cos(angle_y),
                sin_y = Math.sin(angle_y);

            return [
                cos_x, sin_x * sin_y, sin_x * cos_y,
                0, cos_y, -sin_y,
                -sin_x, cos_x * sin_y, cos_x * cos_y
            ];
        }

        function matMul(x, y)
        {
            return [
                x[0]*y[0] + x[1]*y[3] + x[2]*y[6],
                x[0]*y[1] + x[1]*y[4] + x[2]*y[7],
                x[0]*y[2] + x[1]*y[5] + x[2]*y[8],
                x[3]*y[0] + x[4]*y[3] + x[5]*y[6],
                x[3]*y[1] + x[4]*y[4] + x[5]*y[7],
                x[3]*y[2] + x[4]*y[5] + x[5]*y[8],
                x[6]*y[0] + x[7]*y[3] + x[8]*y[6],
                x[6]*y[1] + x[7]*y[4] + x[8]*y[7],
                x[6]*y[2] + x[7]*y[5] + x[8]*y[8]
            ];
        }

        // Define drag and zoom behaviour
        var spinBeforeDrag;
        dragStarted = function(d)
        {
            spinBeforeDrag = spinPlot;
            spinPlot = false;
            selection.on('mousemove', function() {});
            svg_g.transition().duration(0).call(rotate, current_rot, current_scale);
        }

        dragged = function(d)
        {
            var dx_scale = xScale.invert(d3.event.x + d3.event.dx) - xScale.invert(d3.event.x),
                dy_scale = yScale.invert(d3.event.y + d3.event.dy) - yScale.invert(d3.event.y);

            var angle_x = -dx_scale * Math.PI / 2,
                angle_y = dy_scale * Math.PI / 2;

            var rot_drag = getRotation(angle_x, angle_y);
            var rot = matMul(current_rot, rot_drag);

            svg_g.call(rotate, rot, current_scale);
        }

        dragEnded = function(d)
        {
            spinPlot = spinBeforeDrag;
            selection.on('mousemove', directSpin);
            svg_g.transition().duration(0).on("end", spin);
        }

        updateColor = function(duration = 0)
        {
            var circles = svg_g.selectAll(".circle");
            if (duration > 0) circles = circles.transition().duration(duration).ease(d3.easeLinear);
            circles
                .style("fill", function(d) { if (colColumn) {
                    return colScale(d[colColumn])} else {return circleColor}
                })
                .style("stroke", function(d) { if (colColumn) {
                    return colScale(d[colColumn])} else {return circleColor} 
                });
        }

        var orig_data;
        randomizeData = function()
        {
            showNames = [];

            orig_data = data.map(
                function(d) {
                    var out = {};
                    Object.assign(out, d);
                    return out
                }
            )

            data = spherize(data_random.map(
                function(d) {
                    var out = {};
                    Object.assign(out, d);
                    return out
                }
            ), spherification);
            updateData(2000);
        }

        var ii = 0;
        var finish_next = false;
        function animateStep() {
            var p = Math.min(1, Math.pow(ii / (15 - 1), 0.5));

            data = spherize(orig_data.map(
                function(d, i) {
                    var out = {};
                    Object.assign(out, d);
                    out[xColumn] = out[xColumn] * p + data_random[i][xColumn] * (1 - p) + Math.random() / 5 * (1 - p);
                    out[yColumn] = out[yColumn] * p + data_random[i][yColumn] * (1 - p) + Math.random() / 5 * (1 - p);
                    out[zColumn] = out[zColumn] * p + data_random[i][zColumn] * (1 - p) + Math.random() / 5 * (1 - p);
                    return out
                }
            ), spherification);

            // Define cirle elements
            var circles_g = svg_g.selectAll(".circle_g").data(data, function(d) { return d[nameColumn]; });

            circles_g.each(function(d) { d3.select(this).select(".circle").data(d); });
            
            if (!finish_next)
                svg_g.transition().duration(500).ease(d3.easeLinear)
                    .call(rotate, current_rot, current_scale).on("end", animateStep);
                    
            if (p == 1) finish_next = true
            ii++;
        }
        animateTrain = function()
        {
            if (orig_data == null)
                orig_data = base_data.map(
                    function(d) {
                        var out = {};
                        Object.assign(out, d);
                        return out
                    }
                );
            ii = 0;
            animateStep();
        }
    })}

	chart.width = function(value) {
		if (!arguments.length) return width;
		width = value;
        if (typeof updateDimensions === 'function') updateDimensions();
		return chart;
	};

	chart.height = function(value) {
		if (!arguments.length) return height;
		height = value;
        if (typeof updateDimensions === 'function') updateDimensions();
		return chart;
	};

	chart.margins = function(value) {
		if (!arguments.length) return margins;
		margins = value;
		return chart;
	};

	chart.xColumn = function(value, duration = 1000) {
		if (!arguments.length) return xColumn;
		xColumn = value;
        if (typeof updateData === 'function') updateData(duration, true);
		return chart;
	};

	chart.yColumn = function(value, duration = 1000) {
		if (!arguments.length) return yColumn;
		yColumn = value;
        if (typeof updateData === 'function') updateData(duration, true);
		return chart;
	};

	chart.zColumn = function(value, duration = 1000) {
		if (!arguments.length) return zColumn;
		zColumn = value;
        if (typeof updateData === 'function') updateData(duration, true);
		return chart;
	};

	chart.x_max = function(value) {
		if (!arguments.length) return x_max;
		x_max = value;
		return chart;
	};

	chart.y_max = function(value) {
		if (!arguments.length) return y_max;
		y_max = value;
		return chart;
	};

	chart.z_max = function(value) {
		if (!arguments.length) return z_max;
		z_max = value;
		return chart;
	};

	chart.nameColumn = function(value, duration = 1000) {
		if (!arguments.length) return nameColumn;
		nameColumn = value;
        if (typeof updateData === 'function') updateData(duration, true);
		return chart;
	};

	chart.colColumn = function(value, duration = 1000) {
		if (!arguments.length) return colColumn;
		colColumn = value;
        if (typeof updateColor === 'function') updateColor(duration);
		return chart;
	};

	chart.circleColor = function(value, duration = 1000) {
		if (!arguments.length) return circleColor;
        circleColor = value;
        if (typeof updateColor === 'function') updateColor(duration);
		return chart;
	};

	chart.showPoints = function(value) {
		if (!arguments.length) return showPoints;
        showPoints = value;
        if (typeof updateVisible === 'function') updateVisible();
		return chart;
	};

	chart.showNames = function(value, duration = 0) {
		if (!arguments.length) return showNames;
		showNames = value;
        if (typeof updateData === 'function') updateData(duration);
		return chart;
	};

	chart.spinPlot = function(value) {
		if (!arguments.length) return spinPlot;
        spinPlot = value;
        if (typeof updateSpin === 'function') updateSpin();
		return chart;
	};

	chart.spherification = function(value, duration = 1000) {
        if (!arguments.length) return spherification;
		spherification = value;
        if (typeof updateData === 'function') updateData(duration, true);
		return chart;
	};

	chart.data = function(value, duration = 1000, rot, scale) {
        if (!arguments.length) return base_data;
        base_data = value;
        if (typeof updateData === 'function') updateData(duration, true, rot, scale);
    	return chart;
	};

	chart.randomizeData = function() {
        if (typeof randomizeData === 'function') randomizeData();
    	return chart;
	};

	chart.animateTrain = function() {
        if (typeof animateTrain === 'function') animateTrain();
    	return chart;
	};

	chart.dragStart = function() {
        if (typeof dragStart === 'function') dragStarted();
    	return chart;
	};

	chart.drag = function() {
        if (typeof dragStart === 'function') dragged();
    	return chart;
	};

	chart.dragEnd = function() {
        if (typeof dragStart === 'function') dragEnded();
    	return chart;
	};

	return chart;
}