/*******************************************************************************
 **
 ** main.js
 **
 ** Main file for DOM handlers.
 **
 */

(function (main) {

  "use strict";
  var __module__ = main.__module__ = "[main]";

  /***************************************************************************
   ** Dependency check.
   */

  if (typeof jQuery === "undefined") console.log(__module__, " could not load jQuery");
  if (typeof d3 === "undefined") console.log(__module__, " could not load d3");

  /***************************************************************************
   ** Data fields.
   */

   // Object for all the department data.
   main.features = null;
   // DataTable object.
   main.dTable = null;

   let width = 800,
     height = 750,
     centered;

   // Colors based on party.
   let fill_color = {
     "Partido Centro Democrático": "#54b8ec",
     "Partido Cambio Radical": "#de818a",
     "Partido Conservador Colombiano": "#0460a7",
     "Partido Social de Unidad Nacional": "#e46f00",
     "Partido Liberal Colombiano": "#c0000d",
     "Partido Alianza Verde": "#007d3c"
   };

   // Define color scale.
   let color = d3.scale.linear()
     .domain([1, 20])
     .clamp(true)
     .range(['#fff', '#409A99']);

  /***************************************************************************
   ** Routines.
   */

   main.initMap = (function () {
     console.log(__module__, "main.initMap");

     let projection = d3.geo.mercator()
       .scale(2000)
       // Center the Map in Colombia.
       .center([-74, 4.5])
       .translate([width / 2, height / 2]);

     let path = d3.geo.path()
       .projection(projection);

     // Set svg width & height.
     let svg = d3.select('svg')
       .attr('width', width)
       .attr('height', height);

     // Add background
     svg.append('rect')
       .attr('class', 'background')
       .attr('width', width)
       .attr('height', height)
       .on('click', clicked);

     let g = svg.append('g');

     let effectLayer = g.append('g')
       .classed('effect-layer', true);

     let mapLayer = g.append('g')
       .classed('map-layer', true);

     let deptLabel = g.append('text')
       .classed('label-text', true)
       .attr('x', 15)
       .attr('y', 30);

     // Load map data
     d3.json('data/elecciones2018.geo.json', function (error, mapData) {
       main.features = mapData.features;

       // Update color scale domain based on data.
       //color.domain([0, d3.max(features, deptArea)]);

       // Draw each department as a path.
       mapLayer.selectAll('path')
         .data(main.features)
           .enter().append('path')
           .attr('d', path)
           .attr('vector-effect', 'non-scaling-stroke')
         .style('fill', fillFn)
         .style('opacity', 0.6)
           .on('mouseover', mouseover)
           .on('mouseout', mouseout)
           .on('click', clicked);

       // Populate the table with all data initially.
       main.initTable(main.features);
     });

     // Get department area.
     function areaFn(d) {
       return d && d.properties ? d.properties.PARTIDO : null;
     }

     // Get department name.
     function nameFn(d) {
       return d && d.properties ? d.properties.NOMBRE_DPT : null;
     }

     // Get department area size.
     function deptPartido(d) {
       return d.properties.PARTIDO;
     }

     // Get department color.
     // Base color on party.
     function fillFn(d) {
       return fill_color[deptPartido(d)];
     }

     // When clicked, zoom in.
     function clicked(d) {
       let x, y, k;

       //console.log("Department data: " , d.properties);

       // Compute centroid of the selected path.
       if (d && centered !== d) {
         let centroid = path.centroid(d);
         x = centroid[0];
         y = centroid[1];
         k = 4;
         centered = d;
         // Filter to specific department.
         main.filterTable(d.properties);
       } else {
         x = width / 2;
         y = height / 2;
         k = 1;
         centered = null;
         // Remove filter(s).
         main.dTable.search('').draw();
       }

       // Highlight the clicked department.
       mapLayer.selectAll('path')
         .style('opacity', function (d) {
           // Keep full opacity when selected.
           return centered && d === centered ? 1 : 0.6;
         });

       // Clear department name.
       deptLabel.text('');

       // Zoom.
       g.transition()
         .duration(750)
         .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');
     }

     function mouseover(d) {
       // Highlight hovered department.
       d3.select(this).style('opacity', 1);

       deptLabel
         .text(nameFn(d).toUpperCase());
     }

     function mouseout(d) {
       // Reset department opacity.
       mapLayer.selectAll('path')
         .style('opacity', function (d) {
           return centered && d === centered ? 1 : 0.6;
         });

       // Clear department name.
       deptLabel.text('');
     }
   });

   main.filterTable = (function (data) {
     console.log(__module__, "main.filterTable", data);
     let dept = data.NOMBRE_DPT;

     main.dTable.search(dept).draw();
   });

   main.initTable = (function (data) {
     console.log(__module__, "main.initTable");

     // Fill table with all data (default).
     let table = $("#dept-details");
     let tableData = [];

     table.empty();

     for (let i=0; i<data.length; i++) {
       let deptData = {};
       deptData.Departamento = data[i].properties.NOMBRE_DPT;
       deptData.MesasInformadas = data[i].properties.MESAS;
       deptData.Partido = data[i].properties.PARTIDO;
       deptData.Dpto = data[i].properties.DPTO;

       table.append("<tr><td>" + data[i].properties.NOMBRE_DPT + "</td><td>"
                    + data[i].properties.MESAS + "</td><td>" + data[i].properties.PARTIDO + "</td></tr>");
       tableData.push(deptData);
     }

     // If it already exists, retrieve the data table.
     if ($.fn.dataTable.isDataTable('#dept-table')) {
       main.dTable = $('#dept-table').DataTable({
         retrieve: true,
         paging: false
       });
     } else {
       // Initialize data table. Content needs to be an array.
       main.dTable = $('#dept-table').DataTable({
          ordering: true,
          retrieve: true,
          data: tableData,
          searching: true,
          autoWidth: false,
          createdRow: function (row, data, index) {
            // Adding row ID for exclusion purposes.
            $(row).addClass(data.Dpto);
          },
          columns: [
            {'data':'Departamento'},
            {'data':'MesasInformadas'},
            {'data':'Partido'}
          ]
       });
     }

   });

})(typeof exports !== 'undefined' ? exports : (this.main = {}));
/* eof */
