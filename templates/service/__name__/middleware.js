var PATH = require("path");
var Montage = require('montage');

// TODO
// In progress - Load Service/Model/Mapping programaticly 
// Next - Load Via main.mjson

var mr;
function getMontageRequire() {
	// Once only
	if (mr) {
		return Promise.resolve(mr);
	}

	return Montage.loadPackage(PATH.join(__dirname, "."), {
	    mainPackageLocation: PATH.join(__dirname, ".")
	}).then(function (require) {
		return (mr = require);
	});
}

var mainService;
function getMainService() {
	return getMontageRequire().then(function (mr) {

		// Once only
		if (mainService) {
			return Promise.resolve(mainService);
		}

		return mr.async('data/main.mjson').then(function (module) {

			// 1. End goal
			// TODO fix nodejs mjson
			//return (mainService = module.montageObject);

			/*
			// 2. Testing/Debug
			// TODO programatic mjson
			return mr.async('montage/core/serialization/deserializer/montage-deserializer').then(function (module) {
				var deserializer = new module.MontageDeserializer();
	            deserializer.init(mjson, mr, "");
	            return deserializer.deserializeObject();
			});
			*/

			// 3. Testing/Debug
			// TODO programatic loading Service/Model/Mapping
			// Load main service

			// Load main service
			return mr.async("montage/data/service/data-service").then(function (module) {
		        return (mainService = new module.DataService());

		    // Load sub service
		    }).then(function (config) {
	    		return mr.async("logic/model/{{name}}-model").then(function (module) {
			    	return mr.async("logic/service/{{name}}-service").then(function (module) {
			    		var moduleName = "{{exportedName}}Service";
			    		mainService.addChildService(new module[moduleName]());
			    		return mainService;
			    	});
			    });
		    });
		});
	});
}

function getDataQuery(query) {
	return getMontageRequire().then(function (mr) {
		return mr.async("montage/data/service/data-selector").then(function (module) {
		    var DataSelector = module.DataSelector;
		    return mr.async("montage/core/criteria").then(function (module) {
		        var Criteria = module.Criteria;
		        return mr.async('montage/core/serialization/deserializer/montage-deserializer').then(function (module) {
		            return module.deserialize(query, mr); 
		        });
		    });
		});	
	});
}

function createDataQuery(request) {
	return getMontageRequire().then(function (mr) {
		return mr.async("montage/data/service/data-selector").then(function (module) {
		    var DataSelector = module.DataSelector;
		    return mr.async("montage/core/criteria").then(function (module) {
		        var Criteria = module.Criteria;
	    		return mr.async("logic/model/{{name}}-model").then(function (module) {
		            
		            // A Default Query
		            var dataType = module.{{exportedName}};
		            var dataExpression = "id = $id";
		            var dataParameters = {
		            	id: request.query.id
		            };

		            var dataCriteria = new Criteria().initWithExpression(dataExpression, dataParameters);
		            var dataQuery  = DataSelector.withTypeAndCriteria(dataType, dataCriteria);
		     
		            return dataQuery;
		    	
		    	// Convert to serialized version
		    	}).then(function (dataQuery) {
	    			return mr.async('montage/core/serialization/serializer/montage-serializer').then(function (module) {
			            return module.serialize(dataQuery, mr); 
			        });
		    	});
    		});
		});	
	});
}

function createDataQueryResult(queryResult) {
	console.log('createDataQueryResult', queryResult);
	return mr.async('montage/core/serialization/serializer/montage-serializer').then(function (module) {
		return module.serialize(queryResult, mr); 
	}).then(function (res) {
		console.log('createDataQueryResult (serialized)', res);
		return res;
	});
}

// Note: Work in progress

module.exports = function (app) {
	app.route(function (router) {
    	// TODO move router to app (fetchData|create|delete|update)			
	    router("api/fetchData")
		    .method("GET")
		    .contentType("application/json")
		    .contentApp(function (request) {
		    	// You need to do that after route install before .listen that 
		    	// why it's inside the app function
		    	return getMainService().then(function (mainService) {
		    		var queryParam = request.query.query || request.params.query;
					var dataQueryPromise = queryParam ? Promise.resolve(queryParam) : createDataQuery(request);
					return dataQueryPromise.then(function (query) {
						return getDataQuery(query).then(function (dataQuery) {
							return mainService.fetchData(dataQuery).then(function (queryResult) {
								return createDataQueryResult(queryResult);
							});
						});
					});
		    	}).catch(function (err) {
		    		console.error(err, err.stack);
		    		throw err;
		    	});
		    });
	});
};