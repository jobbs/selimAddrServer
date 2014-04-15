var socket_node1 = (function() {
	var socket_node1;
	var config = {
		namespace : '/monitor',
		port : 3000
	};

	return {
		/*
		 * { rss: 4935680,
		 *   heapTotal: 1826816,
		 *   heapUsed: 650472 }
		 *
		 * process.memoryUsage()
		 */
		receiveMemoryUsage_node1 : function() {
			socket_node1.of(config.namespace)
				.emit('getMemoryUsage_node1', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));

					memoryHistory_node1.update({
						entry : {
							data : {
								t : new Date(),
								rss : callback.rss,
								heapTotal : callback.heapTotal,
								heapUsed : callback.heapUsed
							}
						}
					});
			});
		},

		/*
		 * os.cpus()
		 */
		receiveCpuUsage_node1 : function() {
			socket_node1.of(config.namespace)
				.emit('getCpuUsage_node1', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));
					/*
					 * not scalable - not more than 2 cpus supported
					 * needs to be implemented
					 */
					for(var i = 0, len = callback.length; i < len; i++) {
					    var c = callback[i], total = 0;
					    for(type in c.times)
					        total += c.times[type];

					    cpu_node1.update({
					    	bar: i,
					    	value: 100 - (100 * c.times.idle / total)
					    });
					}
				});
		},
		
		/*
		 * os.freemem()
		 * os.totalmem()
		 */
		receiveOsMemory_node1 : function() {
			socket_node1.of(config.namespace)
				.emit('getOsMemory_node1', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));

					memory_node1.update({
						bar: 0,
						value: 100 - (100 * callback.free / callback.total)
					});
				});
		},
	
		
		receiveDiskSpace_node1 : function() {
			socket_node1.of(config.namespace)
				.emit('getDiskSpace_node1', function(callback) {
					
					var value_entry =[];
					var name_entry = [];
					for(var i=0; i<callback.length; i++){
						name_entry.push(callback[i].filesystem);
						value_entry.push(callback[i].percent);
						
					}	
					//console.log("[+] " + dataSource);
					disk_node1.update(name_entry,value_entry);
				});
		},

		connect : function() {
			socket_node1 = new io.connect("http://211.234.68.152:3000");
			socket_node1.of(config.namespace).on('connect_failed', function() {
				console.log("[-] Monitor failed");
			}).on('error', function() {
				console.log("[-] Monitor generic error");
			}).on('connect', function() {
				console.log("[+] 153_node1 Monitor connected");
			});
		}
	};
})();

var collector_node1 = (function() {

	return {
		getMemoryUsage_node1 : function() {
			socket_node1.receiveMemoryUsage_node1();
		},

		getCpuUsage_node1 : function() {
			socket_node1.receiveCpuUsage_node1();
		},

		getOsMemory_node1 : function() {
			socket_node1.receiveOsMemory_node1();
		},

		getDiskSpace_node1 : function() {
			socket_node1.receiveDiskSpace_node1();
		}};
})();

/*=======================Chart Modules=============================*/
var cpu_node1 = (function() {
	var chart_node1;
	var config = {
		preset: "none",
		size: {
			height: 150,
			width: 300
		},

		geometry: {
			startAngle: 180,
			endAngle: 0,
			radius: 50
		},

		margin: {
			left: 0,
			top: 0,
			bottom: 0,
			right: 0
		},

		scale: {
			label: {
				visible: true
			},
			majorTick: {
				showCalculatedTicks: true
			},
		},

		spindle: {
			visible: true,
			color:'red',
			spindleGapSize:15
		},

		 rangeContainer: {
			 ranges: [{
			 startValue: 0,
			 endValue: 50,
			 color: 'blue'
			 }, {
			 startValue: 50,
			 endValue: 100,
			 color: 'red'
			 }
			 ]
			 } ,
			 valueIndicator: {
				color : 'red',
				spindleGapSize: 5
				}
				
	/*	commonRangeBarSettings: {
			size: 8,
			backgroundColor: "#4r4r4r"
		},

		rangeBars: [
			{ value: 0, offset: 50, color: "#355952", text: { indent: 0 } },
			{ value: 0, offset: 60, color: "#28423D", text: { indent: 0 } },
		]*/
	};

	var updateValue = function(options) {
		chart_node1.dxCircularGauge('instance').value(/*options.bar,*/ options.value);
		var test = options.value;
		$("#currentCpuUsage_node1").empty().text(test);
	};

	return {
		update : function(options) {
			updateValue({
				bar: options.bar,
				value: options.value
			});
		},
		init : function(options) {
			chart_node1 = options.chart_node1;
			chart_node1.dxCircularGauge(config);
		}
	};

})();

var memory_node1 = (function() {
	var chart_node1;
	var config = {
		preset: "none",

		scale: {
			majorTick: {
				showCalculatedTicks: true
			}
		},

		margin: {
			left: 0,
			top: 0,
			bottom: 0,
			right: 0
		},

		rangeContainer: {
			backgroundColor: "#222"
		},

		rangeBars: [{ value: 0, color: "#28423D" }]
	};

	var updateValue = function(options) {
		chart_node1.dxLinearGauge('instance').rangeBarValue(options.bar, options.value);
		$("#currentMemoryUsage_node1").empty().text(options.value);
	};

	return {
		update : function(options) {
			updateValue({
				bar: options.bar,
				value: options.value
			});
		},
		init : function(options) {
			chart_node1 = options.chart_node1,
			chart_node1.dxLinearGauge(config);
		}
	};
})();

var memoryHistory_node1 = (function() {
	var dataSource = [];
	var chart_node1;
	var config = {
		margin : {
			top : 0,
			bottom : 0,
			left : 0,
			right : 0
		},

		scale : {
			majorTickInterval : {
				seconds : 30
			},
			minorTickInterval: "minutes",
			label: { 
				visible: true,
			},
			showMinorTicks: false,
		},

		sliderMarker : {
			visible : false
		},

		behavior : {
			animationEnabled : false
		},

		size : {
			height : 150
		},

		dataSource : dataSource,

		chart: {
			series : [{
				argumentField : "t",
				valueField : "rss",
				color : "red"
			}, {
				argumentField : "t",
				valueField : "heapTotal",
				color : "green"
			}, {
				argumentField : "t",
				valueField : "heapUsed",
				color : "yellow"
			}],
			valueAxis : {
				min : 0
			}
		}
	};	
	var addMemoryHistory = function(entry) {
		dataSource.push(entry.data);
	};
	var cleanMemoryHistory = function() {
		// delete first item when length >= 60
		if (Object.keys(dataSource).length >= 60) {
			dataSource.splice(0, 1);
		}
	};

	return {
		update : function(options) {
			addMemoryHistory(options.entry);
			cleanMemoryHistory();
			chart_node1.dxRangeSelector('instance').option('dataSource', dataSource);
			//chart.dxRangeSelector('instance').endUpdate();
			//console.log("UPDATE" + JSON.stringify(dataSource));
		},
		init : function(options) {
			chart_node1 = options.chart_node1;
			chart_node1.dxRangeSelector(config);
		}
	};
})();

var disk_node1 = (function() {
	var chart_node1;	
	var name_datasource=[];
	var value_datasource=[];
	
 var config ={

	    startValue: 0,
	    endValue: 100,
	    values: [0,0,0,0],
	    label: {
	        indent: 30,
	        format: 'fixedPoint',
	        precision: 1,
	        customizeText: function (arg) {
	            return name_datasource[arg.index]+" : "+arg.valueText + ' %';
	        }
	    },
	    title: {
	        text: "노드1 디스크별 사용량",
	        font: {
	            size: 28
	        }
	    }
	};
	var addDiskData = function(name_entry,value_entry) {
		name_datasource = name_entry;
		value_datasource = value_entry;
	};
	var updateValue = function() {
		console.log(value_datasource);
		chart_node1.dxBarGauge('instance').values(value_datasource);		
	};

	return {
		update : function(name_entry,value_entry) {
			addDiskData(name_entry,value_entry);
			updateValue();
		},
		init : function(options) {
			chart_node1 = options.chart_node1;			
			chart_node1.dxBarGauge(config);
		}
	};
})();


var updater_node1 = (function() {
	var interval = 1000;
  var diskInterval = 500;
	return {
		start : function(options) {
			if (!isNaN(options.interval)) {
				interval = options.interval;
			}
			setInterval(function() {
				collector_node1.getMemoryUsage_node1();
				collector_node1.getCpuUsage_node1();
				collector_node1.getOsMemory_node1();
			}, interval);
			
			setInterval(function() {
				collector_node1.getDiskSpace_node1();
			}, diskInterval);
		}
	};
})();

$(document).ready(function() {
	socket_node1.connect();

	memoryHistory_node1.init({
		chart_node1: $('#monChartMemory_node1')
	});

	cpu_node1.init({
		chart_node1: $('#monCPU_node1')
	});

	memory_node1.init({
		chart_node1: $("#monMemory_node1")
	});

	disk_node1.init({
		chart_node1: $("#pieChartContainer_node1")
	});
	
	updater_node1.start({
		interval : 1000
	});

});
