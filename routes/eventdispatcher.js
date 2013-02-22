var events = require('events');
var util = require('util');

// The Thing That Emits Event
Eventer = function(){
  events.EventEmitter.call(this);
  
  this.loginComplete = function(data){
    this.emit('loginComplete', data);
  } 
  
  this.feedsloaded = function(data){
    this.emit('feedsloaded', data);
  }
  
  this.itemsloaded = function(data){
    this.emit('itemsloaded', data);
  }

  this.searchComplete = function(data){
    this.emit('searchComplete', data);
  } 
  this.addComplete = function(data){
    this.emit('addComplete', data);
  }

  
 };
util.inherits(Eventer, events.EventEmitter);


