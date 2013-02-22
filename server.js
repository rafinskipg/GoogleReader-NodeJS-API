var express = require('express'),
    googlereader = require('./routes/googleapi');
 
var app = express();
 
app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});
 
app.post('/login/:mail', googlereader.login);
app.get('/hasauth', googlereader.hasauth);
app.get('/feeds', googlereader.loadfeeds);
app.post('/items', googlereader.getitems);
app.post('/search', googlereader.search);
app.post('/add', googlereader.add);
/*app.get('/wines/:id', googlereader.findById);
app.post('/wines', googlereader.addWine);
app.put('/wines/:id', googlereader.updateWine);
app.delete('/wines/:id', googlereader.deleteWine);*/
 
app.listen(3000);
console.log('Listening on port 3000...');