exports.findAll = function(req, res) {
    res.send([{name:'wine1'}, {name:'wine2'}, {name:'wine3'}]);
};
 
exports.findById = function(req, res) {
    res.send({id:req.params.id, name: "The Name", description: "description"});
};


var greader = require("../google-reader")
var eventdispatcher = require("./eventdispatcher");

//Observer pattern for triggering and listening calls
var eventer = new Eventer();

//Check if has auth
exports.hasauth = function(req, res){
	
	var auth = greader.reader.hasAuth();
	 res.header("Access-Control-Allow-Origin", "*");
	  
	if(auth == true){
		res.send('OK');
	}else{
		res.send('FALSE');
	}
   
}


//Do login
exports.login = function(req, res){
	var mail = req.params.mail;
	var pass =  req.body.pass;
	
	res.header("Access-Control-Allow-Origin", "*");
	
	var successCallback = function(){
		eventer.loginComplete('OK');
	};
	var failCallback = function(){
		eventer.loginComplete('FAIL');
	};
	greader.reader.login(mail, pass, successCallback, failCallback);

	eventer.on('loginComplete', function(data){
	console.log(data);
		res.send(data);
	});
	
   
}


exports.loadfeeds = function(req, res){
	
	res.header("Access-Control-Allow-Origin", "*");

	var successCallback = function(feeds){
		eventer.feedsloaded(feeds);
	};
	
	greader.reader.loadFeeds(successCallback);

	eventer.on('feedsloaded', function(data){
		res.send(data);
	});
	
   
}
exports.getitems = function(req, res){
	
	var url =  req.body.url;
	
	res.header("Access-Control-Allow-Origin", "*");
	
	var successCallback = function(feeds){
		eventer.itemsloaded(feeds);
	};
	
	greader.reader.getItems(url, successCallback);

	eventer.on('itemsloaded', function(data){
		res.send(data);
	});
   
}
exports.search = function(req, res){
	
	var value =  req.body.value;
	
	res.header("Access-Control-Allow-Origin", "*");
	
	var successCallback = function(feeds){
		eventer.searchComplete(feeds);
	};
	var failCallback = function(){
		eventer.searchComplete('FAIL');
	};
	greader.reader.processFeedInput(value, successCallback, failCallback);

	eventer.on('searchComplete', function(data){
		res.send(data);
	});
   
}

exports.add = function(req, res){
	
	var url =  req.body.url;
	var title =  req.body.title;
	if(typeof(req.body.label != 'undefined')){
		var label =  req.body.label;
	}else{
		var label = '';
	}
	
	
	res.header("Access-Control-Allow-Origin", "*");
	
	var successCallback = function(feeds){
		eventer.addComplete(feeds);
	};
	
	greader.reader.subscribeFeed(url, successCallback, title, label) 

	eventer.on('addComplete', function(data){
		res.send(data);
	});
   
}