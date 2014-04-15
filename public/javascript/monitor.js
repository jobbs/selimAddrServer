var socket = (function() {
	var socket;
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
		receiveMemoryUsage : function() {
			socket.of(config.namespace)
				.emit('getMemoryUsage', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));

					memoryHistory.update({
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
		receiveCpuUsage : function() {
			socket.of(config.namespace)
				.emit('getCpuUsage', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));
					/*
					 * not scalable - not more than 2 cpus supported
					 * needs to be implemented
					 */
					for(var i = 0, len = callback.length; i < len; i++) {
					    var c = callback[i], total = 0;
					    for(type in c.times)
					        total += c.times[type];

					    cpu.update({
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
		receiveOsMemory : function() {
			socket.of(config.namespace)
				.emit('getOsMemory', function(callback) {
					//console.log("[+] " + JSON.stringify(callback));

					memory.update({
						bar: 0,
						value: 100 - (100 * callback.free / callback.total)
					});
				});
		},
	
		
		receiveDiskSpace : function() {
			socket.of(config.namespace)
				.emit('getDiskSpace', function(callback) {
					
					var value_entry =[];
					var name_entry = [];
					for(var i=0; i<callback.length; i++){
						name_entry.push(callback[i].filesystem);
						value_entry.push(callback[i].percent);
						
					}	
					//console.log("[+] " + dataSource);
					disk.update(name_entry,value_entry);
				});
		},

		connect : function() {
			socket = new io.connect("http://" + location.hostname + ":" + config.port);
			socket.of(config.namespace).on('connect_failed', function() {
				console.log("[-] Monitor failed");
			}).on('error', function() {
				console.log("[-] Monitor generic error");
			}).on('connect', function() {
				console.log("[+] Monitor connected");
			});
		}
	};
})();

var collector = (function() {

	return {
		getMemoryUsage : function() {
			socket.receiveMemoryUsage();
		},

		getCpuUsage : function() {
			socket.receiveCpuUsage();
		},

		getOsMemory : function() {
			socket.receiveOsMemory();
		},

		getDiskSpace : function() {
			socket.receiveDiskSpace();
		}};
})();

/*=======================Chart Modules=============================*/
var cpu = (function() {
	var chart;
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
		chart.dxCircularGauge('instance').value(/*options.bar,*/ options.value);
		var test = options.value;
		$("#currentCpuUsage").empty().text(test);
	};

	return {
		update : function(options) {
			updateValue({
				bar: options.bar,
				value: options.value
			});
		},
		init : function(options) {
			chart = options.chart;
			chart.dxCircularGauge(config);
		}
	};

})();

var memory = (function() {
	var chart;
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
		chart.dxLinearGauge('instance').rangeBarValue(options.bar, options.value);
		$("#currentMemoryUsage").empty().text(options.value);
	};

	return {
		update : function(options) {
			updateValue({
				bar: options.bar,
				value: options.value
			});
		},
		init : function(options) {
			chart = options.chart,
			chart.dxLinearGauge(config);
		}
	};
})();

var memoryHistory = (function() {
	var dataSource = [];
	var chart;
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

		chart : {
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
			chart.dxRangeSelector('instance').option('dataSource', dataSource);
			//chart.dxRangeSelector('instance').endUpdate();
			//console.log("UPDATE" + JSON.stringify(dataSource));
		},
		init : function(options) {
			chart = options.chart;
			chart.dxRangeSelector(config);
		}
	};
})();

var disk = (function() {
	var chart;	
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
	        text: "마스터노드 디스크별 사용량",
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
		chart.dxBarGauge('instance').values(value_datasource);		
	};

	return {
		update : function(name_entry,value_entry) {
			addDiskData(name_entry,value_entry);
			updateValue();
		},
		init : function(options) {
			chart = options.chart;			
			chart.dxBarGauge(config);
		}
	};
})();


var updater = (function() {
	var interval = 1000;
  var diskInterval = 500;
	return {
		start : function(options) {
			if (!isNaN(options.interval)) {
				interval = options.interval;
			}
			setInterval(function() {
				collector.getMemoryUsage();
				collector.getCpuUsage();
				collector.getOsMemory();
			}, interval);
			
			setInterval(function() {
				collector.getDiskSpace();
			}, diskInterval);
		}
	};
})();

$(document).ready(function() {
	socket.connect();

	memoryHistory.init({
		chart : $('#monChartMemory')
	});

	cpu.init({
		chart : $('#monCPU')
	});

	memory.init({
		chart: $("#monMemory")
	});

	disk.init({
		chart: $("#pieChartContainer")
	});

	
	updater.start({
		interval : 1000
	});

});