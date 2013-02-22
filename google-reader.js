/*IMPORTS*/
var _  = require('./underscore');
// Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
_.string = require('./underscore-string');
// Mix in non-conflict functions to Underscore namespace if you want
_.mixin(_.string.exports());
// All functions, include conflict, will be available through _.str object
_.string.include('Underscore.string', 'string'); // => true

var http = require("http");
var https = require("https");
var requestModule = require('request');


	/* LOCAL STORAGE WRAPPER FOR SHIT */
    var localStorage =[];
	function localStorageWrapper (key) {
		this.key = key;
	}
	localStorageWrapper.prototype.get = function () {
		if (!localStorage[this.key]) {
			return;
		}

		try {
			return JSON.parse(localStorage[this.key]);
		} catch(e) {
			 return localStorage[this.key];
		}

	}
	localStorageWrapper.prototype.set = function (value) {
		try {
			localStorage[this.key] = (typeof value === "string") ? value : JSON.stringify(value);
		} catch (e){
			console.error("Error Saving to localStorage");
		}
	},
	localStorageWrapper.prototype.del = function () {
		delete localStorage[this.key];
	}
	/* END OF LOCAL STORAGE WRAPPER FOR SHIT */

	
	"use strict";

	//we need the underscore string lib
	_.mixin(_.string.exports());

	var reader = {};
	var respuesta = {};
	//global constants that will likely be used outside of this file
	reader.TAGS = {
		"like": "user/-/state/com.google/like",
		"label": "user/-/label/",
		"star": "user/-/state/com.google/starred",
		"read": "user/-/state/com.google/read",
		"fresh": "user/-/state/com.google/fresh",
		"share": "user/-/state/com.google/broadcast",
		"kept-unread": "user/-/state/com.google/kept-unread",
		"reading-list": "user/-/state/com.google/reading-list"
	};
	//global variables
	reader.has_loaded_prefs = false;

	//constants that will only be used in this file 
	var CLIENT = "Tibfib", //put your own string here
		//base urls
		LOGIN_URL = "https://www.google.com/accounts/ClientLogin", 
		BASE_URL = "https://www.google.com/reader/api/0/",
		//url paths
		PREFERENCES_PATH = "preference/stream/list",
		STREAM_PATH = "stream/contents/",
		SUBSCRIPTIONS_PATH = "subscription/",
		TAGS_PATH = "tag/",
		//url actions
		LIST_SUFFIX = "list",
		EDIT_SUFFIX = "edit",
		MARK_ALL_READ_SUFFIX = "mark-all-as-read",
		TOKEN_SUFFIX = "token",
		USERINFO_SUFFIX = "user-info",
		UNREAD_SUFFIX = "unread-count",
		RENAME_LABEL_SUFFIX = "rename-tag",
		EDIT_TAG_SUFFIX = "edit-tag";

	var readerFeeds = [], //we want to be able to get/set our feeds outside of this file
		readerAuth = new localStorageWrapper("Auth"), //no interface outside of this file
		readerUser = new localStorageWrapper("User"); //can get from outside of file 

	reader.setFeeds = function (feeds) {
		readerFeeds = feeds;	
	};
	reader.getFeeds = function () {
		return readerFeeds;
	};
	reader.getLabels = function () {
		return _(reader.getFeeds()).select(function (feed) { return feed.isLabel; });
	};
	reader.getUser = function () {
		//readerUser is an object with user info like the user's email address.
		return readerUser;
	};


	//the core ajax function, you won't need to use this directly
	var readerToken = "",
		requests = [],
		makeRequest = function (obj, noAuth) {
			//make sure we have a method and a parameters object
			obj.method = obj.method || "GET";
			obj.parameters = obj.parameters || {};

			//add the necessary parameters to get our requests to function properly
			if (obj.method === "GET") {
				obj.parameters.ck = Date.now() || new Date().getTime();
				obj.parameters.accountType = "GOOGLE";
				obj.parameters.service = "reader";
				obj.parameters.output = "jsonp";	
				obj.parameters.client = CLIENT;
			}

			//if we have a token, add it to the parameters
			if (readerToken && obj.method === "POST") {
				//it seems that "GET" requests don't care about your token
				obj.parameters.T = readerToken;			
			}
			
			//turn our parameters object into a query string
			var queries = [], 
				key, 
				queryString;

			function getQueries(objectToSearch){
				for (key in objectToSearch) {
					if (objectToSearch.hasOwnProperty(key)) {
						//console.log("key", key);
						if(key === "set"){
							//for some requests, you can send the same keys sequentially ex: ?i=2&s=dog&i=4&s=cat ...
							//we support this, but you have to pass the keys that get listed multiple times as a set array of objects.
							//set: [{i: 2, s: "dog"}, {i: 4, s: "cat"}];
							_.each(objectToSearch[key], function(singleSet){
								getQueries(singleSet);
							});
						} else {
							queries.push(encodeURIComponent(key) + "=" + encodeURIComponent(objectToSearch[key]));				
						}
					}
				}
			}

			getQueries(obj.parameters);
			
			queryString = queries.join("&");

			
			//for get requests, attach the queryString
			//for post requests, attach just the client constant
			var url = (obj.method === "GET") ? (obj.url + "?" + queryString) : (obj.url + "?" + encodeURIComponent("client") + "=" + encodeURIComponent(CLIENT));
			
			/*MI CODIGO*/
			var requestIndex = requests.length;		
			var googleHeaders = {};
			if (readerAuth.get() && !noAuth) {
				//this one is important. This is how google does authorization.
				 googleHeaders = {"Authorization" : "GoogleLogin auth=" + readerAuth.get(), 'content-type': 'application/x-www-form-urlencoded'};
				 
			}
			
			if(obj.url == 'https://www.google.com/reader/api/0/user-info'){
				url = 'https://www.google.com/reader/api/0/user-info?output=json';
			}else if(obj.url == 'https://www.google.com/reader/api/0/preference/stream/list' ){
				url = 'https://www.google.com/reader/api/0/preference/stream/list?output=json';
			}else if(obj.url == 'https://www.google.com/reader/api/0/subscription/list' ){
				url = 'https://www.google.com/reader/api/0/subscription/list?output=json';
			}else if(obj.url == 'https://www.google.com/reader/api/0/tag/list' ){
				url = 'https://www.google.com/reader/api/0/tag/list?output=json';
			}else if(obj.url == 'https://www.google.com/reader/api/0/unread-count' ){
				url = 'https://www.google.com/reader/api/0/unread-count?output=json';
			}else if(obj.url == 'https://www.google.com/reader/api/0/token' ){
				url = 'https://www.google.com/reader/api/0/token?output=json';
			}
			console.log('hola %o', url);
			console.log('hola %o', obj.parameters.s);
			
			if(typeof(obj.isItems) != 'undefined' && obj.isItems == true){
				url = obj.url;
			}
			
			if(obj.method == 'POST'){
			
				var request = {uri:url, headers :googleHeaders, body:require('querystring').stringify(obj.parameters),  method:obj.method};
			}else{
				var request = {uri:url, headers :googleHeaders, method:obj.method};
			}
			
			
			var r = requestModule(request, function (error, response, body) {
				  parseResponseGoogleReader(error, response, body);
			});
			
			if(obj.url == 'https://www.google.com/reader/api/0/user-info'){
				r.pipe(fs.createWriteStream('RESPONSES/user-info.txt'))
			}else if(obj.url == 'https://www.google.com/reader/api/0/preference/stream/list' ){
				r.pipe(fs.createWriteStream('RESPONSES/stream-list.txt'))
			}else if(obj.url == 'https://www.google.com/reader/api/0/subscription/list' ){
				r.pipe(fs.createWriteStream('RESPONSES/subscription-list.txt'))
			}else if(obj.url == 'https://www.google.com/reader/api/0/tag/list' ){
				r.pipe(fs.createWriteStream('RESPONSES/tag-list.txt'))
			}else if(obj.url == 'https://www.google.com/reader/api/0/token' ){
				r.pipe(fs.createWriteStream('RESPONSES/token.txt'))
			}else if(obj.url == 'https://www.google.com/reader/api/0/unread-count' ){
				r.pipe(fs.createWriteStream('RESPONSES/unread-count.txt'))
			}
			r.pipe(fs.createWriteStream('RESPONSES/pushlog.txt'))
			/*FIN MICODIGO*/
			
			
			
			
			
			function parseResponseGoogleReader(error, response, body){
			
				if (response.statusCode === 200) {
					if (obj.onSuccess) {
						obj.onSuccess(response);
						if (requests[requestIndex]) {
							delete requests[requestIndex];
						}
					}
				} else{
					if (obj.method === "POST") {
						if (!obj.tried) {
							//If it failed and this is a post request, try getting a new token, then do the request again
							reader.getToken(function () {
								obj.tried = true;
								makeRequest(obj);
								if (requests[requestIndex]) {
									delete requests[requestIndex];
								}
							}, obj.onFailure);
						}
					} else {
						if (obj.onFailure) {
							obj.onFailure(response);
							if (requests[requestIndex]) {
								delete requests[requestIndex];
							}
						}
					}
					if (response.statusCode === 401 ) {
						//This probably means your Auth expired. The user needs to log in again.

						//Humane is a notification lib. (yes this is bad practice, but easier than checking for this on every fail callback) 
						if (humane) {
							var newHumane = humane.create();
							newHumane.log(response.statusText + ". " + "Try logging in again.",  {timeout: 2000, clickToClose: false});
						} else {
							console.error("AUTH EXPIRED? TRY LOGGING IN AGAIN");
						}
					}

					console.error("Request Failed: " + response.statusCode);
					response.pipe(fs.createWriteStream('RESPONSES/jodido.txt'))
				}
			};

			
			requests.push(request);

			
		};

	// *************************************
	// *
	// *	Authentication
	// *
	// *************************************

	//First order of business is to check for the Auth Header.
	//If it exists, call getToken();
	//If it doesn't, prompt the user for their username/password
	reader.hasAuth = function(){
		if(readerAuth.get()){
			return true;
		}
	};

	//Get our auth header; saved to localStorage.
	reader.login = function ( email, password, successCallback, failCallback) {
		if (email.length === 0 || password.length === 0) {
			failCallback("Blank Info...");
			return;
		}
		
		makeRequest({
			method: "GET",
			url: LOGIN_URL,
			parameters: {
				Email: email,
				Passwd: password
			},
			onSuccess: function (transport) {
				//this is what authorizes every action the user takes
				readerAuth.set(_.lines(transport.body)[2].replace("Auth=", ""));
				
				getUserInfo(successCallback, failCallback);
				
			},
			onFailure: function (transport) {
				console.error(transport);
				failCallback(reader.normalizeError(transport.body));
				
			}
		});
		
	};

	//Gets our token for POST requests; saved to localStorage;.
	//If it fails, your auth header has expired and you need to have the user login again.
	reader.getToken = function (successCallback, failCallback) {
	 
		makeRequest({
			method: "GET",
			url: BASE_URL + TOKEN_SUFFIX,
			parameters: {},
			onSuccess: function (transport) {
				readerToken = transport.body;
				successCallback();
				
			}, 
			onFailure: function (transport) {
				console.error("failed", transport);
				if (failCallback) {
					failCallback(reader.normalizeError(transport.body));
				}
			}
		});
	};

	//Logout the user
	reader.logout = function () {
		
		//delete localStorage.Auth;
		readerAuth.del();
		//delete localStorage.User;
		readerUser.del();

		reader.setFeeds([]);
	};

	//Gets the user info, an object of data. Needed for our other requests.
	var getUserInfo = function (successCallback, failCallback) {
		console.log('GetUserInfo');
		makeRequest({
			method: "GET",
			url: BASE_URL + USERINFO_SUFFIX,
			parameters: {},
			onSuccess: function (transport) {
				readerUser.set(JSON.parse(transport.body));
			
				successCallback();
			},
			onFailure: function (transport) {
				console.error(transport);
				if (failCallback) {
					failCallback(reader.normalizeError(transport.body));
					
				}
			}
		});			
	};

	var getUserPreferences = function (successCallback, failCallback) {
		makeRequest({
			method: "GET",
			url: BASE_URL + PREFERENCES_PATH,
			parameters: {},
			onSuccess: function (transport) {
				reader.has_loaded_prefs = true;
				reader.userPrefs = JSON.parse(transport.body).streamprefs;
				if (successCallback) {
					successCallback();				
				}
			},
			onFailure: function (transport) {
				console.error(transport);
				if (failCallback) {
					failCallback(reader.normalizeError(transport.body));
					
				}
			}
		});		
	};


	// *************************************
	// *
	// *	Loading Feeds
	// *
	// *************************************

	//Get the user's subscribed feeds, organizes them in a nice little array.
	reader.loadFeeds = function (successCallback) {
		function loadFeeds() {
			makeRequest({
				method: "GET",
				url: BASE_URL + SUBSCRIPTIONS_PATH + LIST_SUFFIX,
				onSuccess: function (transport) {
					//save feeds in an organized state.

					loadLabels(function (labels) {
						//get unread counts
						getUnreadCounts(function (unreadcounts) {

							//organize and save feeds
							reader.setFeeds(
								organizeFeeds(
									JSON.parse(transport.body).subscriptions, 
									labels, 
									unreadcounts,
									reader.userPrefs
								)
							);

							//callback with our feeds
							successCallback(reader.getFeeds());
						});	

					});
					
				},
				onFailure: function (transport) {
					console.error(transport);
				}
			});	
		}
		if (reader.has_loaded_prefs) {
			loadFeeds();
		} else {
			getUserPreferences(loadFeeds);
		}
	};

	var loadLabels = function (successCallback) {
		makeRequest({
			method: "GET",
			url: BASE_URL + TAGS_PATH + LIST_SUFFIX,
			onSuccess: function (transport) {
				//save feeds in an organized state.
				successCallback(JSON.parse(transport.body).tags);
			},
			onFailure: function (transport) {
				console.error(transport);
			}
		});	
	
	};

	//organizes feeds based on labels.
	var organizeFeeds = function (feeds, inLabels, unreadCounts, userPrefs) {
		var unlabeled = [], 
			labels = _(inLabels).reject(function(label){
				return reader.correctId(label.id) === "user/-/state/com.google/broadcast" || reader.correctId(label.id) === "user/-/state/com.blogger/blogger-following";
			});

		labels.unshift({title: "All", id: reader.TAGS["reading-list"], feeds: feeds, isAll: true, isSpecial: true});

		var labelTitleRegExp = /[^\/]+$/i;
		_(labels).each(function (label) {
			
			label.title = label.title || labelTitleRegExp.exec(label.id)[0];

			//based on title add unique properties
			if (label.title === "starred") {
				label.title = _(label.title).capitalize();
				label.isSpecial = true;
			} else if (!label.isSpecial) {
				label.isLabel = true;
			}

			label.feeds = [];
		
			//remove digits from the id
			label.id = reader.correctId(label.id);

			//apply unreadCounts
			_(unreadCounts).each(function (unreadCount) {
				unreadCount.id = reader.correctId(unreadCount.id);

				if (label.id === unreadCount.id) {
					label.count = unreadCount.count;
					label.newestItemTimestamp = unreadCount.newestItemTimestampUsec;	
				}
			});
		});

		//process feeds
		_(feeds).each(function (feed) {
			//give isFeed property, useful for identifying
			feed.isFeed = true;

			//replace digits from the id
			feed.id = reader.correctId(feed.id);

			//apply unread counts
			_(unreadCounts).each(function (unreadCount) {
				if (feed.id === unreadCount.id) {
					feed.count = unreadCount.count;
					feed.newestItemTimestamp = unreadCount.newestItemTimestampUsec;	
				}
			});

			if (feed.categories.length === 0) {
				//if the feed has no labels, push it onto the unlabeled array
				unlabeled.push(feed);
			} else {
				//otherwise find the label from the labels array and push the feed into its feeds array
				_(feed.categories).each(function (label) {
					label.id = reader.correctId(label.id);
					_(labels).each(function (fullLabel) {
						if (label.id === fullLabel.id) {
							var feed_clone = _(feed).clone();
								feed_clone.inside = fullLabel.id;

							fullLabel.feeds.push(feed_clone);
						}
					});
				});
			}

		});

		//replace digits
		_(userPrefs).each(function (value, key) {
			if (/user\/\d*\//.test(key)) {
				userPrefs[reader.correctId(key)] = value;
			}
		});

		//remove labels with no feeds
		var labelsWithFeeds = _(labels).reject(function (label) {
			return (label.feeds.length === 0 && !label.isSpecial);
		});

		//order the feeds within labels
		_(labelsWithFeeds).each(function (label) {
			//get the ordering id based on the userPrefs
			var orderingId = _(userPrefs[label.id]).detect(function (setting) {
				return (setting.id === "subscription-ordering");
			});
			if (orderingId) {
				label.feeds = _(label.feeds).sortBy(function (feed) {
					if (orderingId.value.indexOf(feed.sortid) === -1) {
						//if our sortid isn't there, the feed should be at the back.
						return 1000;
					}
					//return the index of our feed sortid, which will be in multiples of 8 since sortid's are 8 characters long.
					return (orderingId.value.indexOf(feed.sortid)) / 8;
				});	
			}	//there might be another setting we should follow like "alphabetical" or "most recent". Just a guess. 
			/*else {
				labels.feeds.sort();
			}*/
			
		});

		//now order ALL feeds and labels
		var orderingId = _(userPrefs["user/-/state/com.google/root"]).detect(function (setting) {
			return (setting.id === "subscription-ordering");
		}) || {value: ""};
		

		//our subscriptions are our labelsWithFeeds + our unlabeled feeds
		var subscriptions = [].concat(labelsWithFeeds, unlabeled);
			//sort them by sortid
			subscriptions = _(subscriptions).sortBy(function (subscription) {
				if (orderingId.value.indexOf(subscription.sortid) === -1 && !subscription.isSpecial) {
					return 1000;
				}
				return (orderingId.value.indexOf(subscription.sortid)) / 8;
			});

		return subscriptions;
	};

	//get unread counts from google reader
	var getUnreadCounts = function (successCallback, returnObject) {
		//passing true for returnObject gets you an object useful for notifications
		makeRequest({
			url: BASE_URL + UNREAD_SUFFIX,
			onSuccess: function (transport) {
				var unreadCounts = JSON.parse(transport.body).unreadcounts;
				//console.log(transport);
				var unreadCountsObj = {};
				_(unreadCounts).each(function (obj) {
					unreadCountsObj[reader.correctId(obj.id)] = obj.count;
				});
				reader.unreadCountsObj = unreadCountsObj;

				if (returnObject) {
					successCallback(unreadCountsObj);	
				} else {
					successCallback(unreadCounts);
				}
				
			}, 
			onFailure: function (transport) {
				console.error(transport);
			}		
		});
	};

	// *************************************
	// *
	// *	Editing Feeds
	// *
	// *************************************

	var editFeed = function (params, successCallback, failCallback) {
		if (!params) {
			console.error("No params for feed edit");
			return;
		}
		
		makeRequest({
			method: "POST",
			url: BASE_URL + SUBSCRIPTIONS_PATH + EDIT_SUFFIX,
			parameters: params,
			isItems: true,
			onSuccess: function (transport) {
				successCallback(transport.body);
			}, 
			onFailure: function (transport) {
				console.error(transport);
				if(failCallback)
					failCallback(transport);
			}
		});
	};

	//edit feed title
	reader.editFeedTitle = function (feedId, newTitle, successCallback, failCallback) {
		editFeed({
			ac: "edit",
			t: newTitle,
			s: feedId
		}, successCallback, failCallback);
	};
	reader.editFeedLabel = function (feedId, label, opt, successCallback, failCallback) {
		//label needs to have reader.TAGS["label"] prepended.

		var obj = {
			ac: "edit",
			s: feedId
		};
		if (opt) {
			obj.a = label;
		} else {
			obj.r = label;
		}
		editFeed(obj, successCallback, failCallback);
	};

	reader.editLabelTitle = function (labelId, newTitle, successCallback, failCallback) {
		//label needs to have reader.TAGS["label"] prepended.

		makeRequest({
			method: "POST",
			url: BASE_URL + RENAME_LABEL_SUFFIX,
			parameters: {
				s: labelId,
				t: labelId,
				dest: reader.TAGS["label"] + newTitle
			},
			onSuccess: function (transport) {
				successCallback(transport.body);
			}, 
			onFailure: function (transport) {
				console.error(transport);
				if (failCallback)
					failCallback();
			}

		});
	};

	reader.markAllAsRead = function (subscriptionId, successCallback) {
		//feed or label
		makeRequest({
			method: "POST",
			url: BASE_URL + MARK_ALL_READ_SUFFIX,
			parameters: {
				s: subscriptionId
			},
			onSuccess: function (transport) {
				successCallback(transport.body);
			}, 
			onFailure: function (transport) {
				console.error(transport);
			}

		});
	};

	// *************************************
	// *
	// *	Adding/Removing Feeds
	// *
	// *************************************
	
	reader.unsubscribeFeed = function (feedId, successCallback) {
		editFeed({
			ac: "unsubscribe",
			s: feedId
		}, successCallback);
	};

	reader.subscribeFeed = function (feedUrl, successCallback, title, label) {
		if(label != ''){
			
			editFeed({
			ac: "subscribe",
			s: "feed/" + feedUrl,
			t: title || undefined,
			a: 'user/'+readerUser.get().userId+'/label/'+label 
			}, successCallback);
		}else{
			editFeed({
			ac: "subscribe",
			s: "feed/" + feedUrl,
			t: title || undefined
			}, successCallback);
		}
		
	};

	// This function searches Google's feed API to find RSS feeds.
	var readerUrlRegex = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?\^=%&amp;:\/~\+#]*[\w\-\@?\^=%&amp;\/~\+#])?/;
	reader.processFeedInput = function (input, successCallback, failCallback) {
		if (readerUrlRegex.test(input)) {
			makeRequest({
				url: "https://ajax.googleapis.com/ajax/services/feed/load",
				parameters: {
					q: encodeURI(input),
					v: "1.0"				
				},
				onSuccess: function (transport) {
					var response = JSON.parse(transport.body);
					if (response.responseStatus === 200) {
						successCallback({isFeed: true, title: response.responseData.feed.title, data: response.responseData})
					} else {
						reader.searchForFeeds(input, successCallback, failCallback);
					}

				}, 
				onFailure: function (transport) {
					console.error(transport);
				}			
			}, true);
		} else {
			reader.searchForFeeds(input, successCallback, failCallback);
		}
	};

	reader.searchForFeeds = function (input, successCallback, failCallback) {
		//remove http://
		//remove path
		//remove TLD
		input = input.replace(/(http:\/\/|https:\/\/)/ig, "").split("/")[0].replace(/\.\w{1,3}\.*\w{0,2}$/ig, "");
		
		makeRequest({
			url: "https://ajax.googleapis.com/ajax/services/feed/find",
			parameters: {
				q: encodeURI(input),
				v: "1.0"				
			},
			onSuccess: function (transport) {
				var response = JSON.parse(transport.body);
				if (response.responseStatus === 200) {
					if (response.responseData.entries) {
						successCallback({results: response.responseData.entries}, "keyword");
					}
				} else {
					failCallback(response.responseDetails);
				}

			}, 
			onFailure: function (transport) {
				console.error(transport);
			}			
		}, true);
	};

	// *************************************
	// *
	// *	Loading Items
	// *
	// *************************************

	reader.getItems = function (feedUrl, successCallback, opts) {
		var params = opts || {n: 50};
			params.r = params.r || "d";
			
		makeRequest({
			method: "GET",
			url: BASE_URL + STREAM_PATH + encodeURIComponent(feedUrl),
			parameters: params, /*{
				//ot=[unix timestamp] : The time from which you want to retrieve items. Only items that have been crawled by Google Reader after this time will be returned.
				//r=[d|n|o] : Sort order of item results. d or n gives items in descending date order, o in ascending order.
				//xt=[exclude target] : Used to exclude certain items from the feed. For example, using xt=user/-/state/com.google/read will exclude items that the current user has marked as read, or xt=feed/[feedurl] will exclude items from a particular feed (obviously not useful in this request, but xt appears in other listing requests).
			},*/
			onSuccess: function (transport) {
				successCallback(JSON.parse(transport.body).items);
			}, 
			onFailure: function (transport) {
				console.error(transport);
			},
			isItems: true
		});
	};

	// *************************************
	// *
	// *	Editing Items
	// *
	// *************************************

	reader.setItemTag = function (subscriptionId, itemId, tag, add, successCallback, failCallback) {

		//single sub id or array of sub ids (ex: ["subId1", "subId2", ...])
		//single item id or array of item ids in corresponding order of sub ids (ex: ["itemId1", "itemId2", ...])
		//tag in simple form: "like", "read", "share", "label", "star", "kept-unread"
		//add === true, or add === false

		//WARNING: The API seems to fail when you try and change the tags of more than ~100 items.

		var params = {
			async: "true",
			ac: "edit-tags"
		};

		if (add === true) {	
			params.a = reader.TAGS[tag];			
		} else 	{			
			params.r = reader.TAGS[tag];			
		}

		if(_.isArray(itemId) && _.isArray(subscriptionId)){
			params.set = [];
			_.each(itemId, function(singleItemId, index){
				params.set.push({i: singleItemId, s: subscriptionId[index]});
			});
		} else {
			params.s = subscriptionId;
			params.i = itemId;
		}


		makeRequest({
			method: "POST",
			url: BASE_URL + EDIT_TAG_SUFFIX,
			parameters: params,
			onSuccess: function (transport) {
				if (transport.body === "OK") {
					successCallback(transport.body);	
				}
			}, 
			onFailure: function (transport) {
				console.error("FAILED", transport);
				if(failCallback)
					failCallback();
			} 
		});
	};

	// *************************************
	// *
	// *	Useful Utilities
	// *
	// *************************************
	
	//this function replaces the number id with a dash. Helpful for comparison
	var readerIdRegExp = /user\/\d*\//;
	reader.correctId = function (id) {
		return id.replace(readerIdRegExp, "user\/-\/");
	};

	var trueRegExp = /^true$/i;
	reader.isRead = function (article) {
		if(article.read !== undefined){
			return trueRegExp.test(article.read);
		}
		for (var i = 0; i < article.categories.length; i++) {
			if(reader.correctId(article.categories[i]) === reader.TAGS['read']){
				return true;
			}
		};
		
		return false;
	};

	reader.isStarred = function (article) {
		if(article.starred !== undefined){
			return trueRegExp.test(article.starred);
		}
		for (var i = 0; i < article.categories.length; i++) {
			if(reader.correctId(article.categories[i]) === reader.TAGS['star']){
				return true;
			}
		};
		
		return false;
	};
	
	//returns url for image to use in the icon
	reader.getIconForFeed = function (feedUrl) {
		return "http://www.google.com/s2/favicons?domain_url=" + encodeURIComponent(feedUrl);
	};

	//normalizes error response for logging in
	reader.normalizeError = function (inErrorResponse) {
		var errorMessage = _(inErrorResponse).lines()[0].replace("Error=", "").replace(/(\w)([A-Z])/g, "$1 $2");
		errorMessage = (errorMessage === "Bad Authentication") ? "Incorrect Email/Password" : errorMessage;
		return errorMessage;
	};

	
	//UTILS TO FILE
	var fs = require('fs');
function writeToFile(obj, filename){

	
	
	var stream = fs.createWriteStream(filename);
	  stream.write(obj);
	  stream.end();
	  /*console.log(obj);
	  
	  var current = 0;
	  var longString = JSON.stringify(obj),
					chunkCount = Math.pow(2, 29),
					bufferSize = Buffer.byteLength(longString),
					longBuffer = new Buffer(longString);
	 
    function writeChunk() {
        if (current < chunkCount) {
            current++;

            if (stream.write(longBuffer)) {
                process.nextTick(writeChunk);
            } else {
                stream.once('drain', writeChunk);
            }
        } else {
            stream.end();
        }
    }

    writeChunk();*/
}
exports.reader = reader;
