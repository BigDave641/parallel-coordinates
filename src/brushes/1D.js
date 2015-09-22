// brush mode: 1D-Axes

(function() {
  var brushes = {};

  function is_brushed(p) {
    return !brushes[p].empty();
  }

  // data within extents
  function selected() {
    var actives = __.dimensions.filter(is_brushed),
        extents = actives.map(function(p) { return brushes[p].extent(); });

    // We don't want to return the full data set when there are no axes brushed.
    // Actually, when there are no axes brushed, by definition, no items are
    // selected. So, let's avoid the filtering and just return false.
    //if (actives.length === 0) return false;

    // Resolves broken examples for now. They expect to get the full dataset back from empty brushes
    if (actives.length === 0) return __.data;

    // test if within range
    var within = {
      "date": function(d,p,dimension) {
        return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1]
      },
      "number": function(d,p,dimension) {
        return extents[dimension][0] <= d[p] && d[p] <= extents[dimension][1]
      },
      "string": function(d,p,dimension) {
        return extents[dimension][0] <= yscale[p](d[p]) && yscale[p](d[p]) <= extents[dimension][1]
      }
    };

    return __.data
      .filter(function(d) {
        switch(brush.predicate) {
        case "AND":
          return actives.every(function(p, dimension) {
            return within[__.types[p]](d,p,dimension);
          });
        case "OR":
          return actives.some(function(p, dimension) {
            return within[__.types[p]](d,p,dimension);
          });
        default:
          throw "Unknown brush predicate " + __.brushPredicate;
        }
      });
  };

  function brushExtents() {
    var extents = {};
    __.dimensions.forEach(function(d) {
      var brush = brushes[d];
      if (brush !== undefined && !brush.empty()) {
        var extent = brush.extent();
        extent.sort(d3.ascending);
        extents[d] = extent;
      }
    });
    return extents;
  };

  /** A setter for 1D-axes brushes, accessible from outside of parcoords. */
  function setBrushExtents(initialExtents) {
	  
    for (var key in initialExtents) {
	  brushes[key].extent(initialExtents[key])
    }
    if (g) {
      g.selectAll('.brush').each(function(d) {
	    if (!(brushes[d].empty())){
		  d3.select(this) // draws the brush initially
		    .call(brushes[d]);
		
		  d3.select(this) // re-draw brushes with set extent, then start brush event
		    .transition()
		    .duration(50)
		    .call(brushes[d].extent(initialExtents[d]))
		    .call(brushes[d].event);
		
	    } else {
		  d3.select(this).call(brushes[d].clear());
	    }
	  });
    }
    return pc;
  };
  
  function brushFor(axis) {
    var brush = d3.svg.brush();

    brush
      .y(yscale[axis])
      .on("brushstart", function() {
        d3.event.sourceEvent ? d3.event.sourceEvent.stopPropagation() : 0;
      })
      .on("brush", function() {
        brushUpdated(selected());
      })
      .on("brushend", function() {
        events.brushend.call(pc, __.brushed);
      });

    brushes[axis] = brush;
    return brush;
  };

  function brushReset(dimension) {
    __.brushed = false;
    if (g) {
      g.selectAll('.brush')
        .each(function(d) {
          d3.select(this).call(
            brushes[d].clear()
          );
        });
      pc.renderBrushed();
    }
    return this;
  };

  function install() {
    if (!g) pc.createAxes();

    // Add and store a brush for each axis.
    g.append("svg:g")
      .attr("class", "brush")
      .each(function(d) {
        d3.select(this).call(brushFor(d));
      })
      .selectAll("rect")
        .style("visibility", null)
        .attr("x", -15)
        .attr("width", 30);

    pc.brushExtents = brushExtents;
    pc.setBrushExtents = setBrushExtents;
    pc.brushReset = brushReset;
    return pc;
  };

  brush.modes["1D-axes"] = {
    install: install,
    uninstall: function() {
      g.selectAll(".brush").remove();
      brushes = {};
      delete pc.brushExtents;
	  delete pc.setBrushExtents;
      delete pc.brushReset;
    },
    selected: selected,
    brushState: brushExtents
  }
})();
