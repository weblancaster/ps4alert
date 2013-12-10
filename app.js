// App defaults
var express = require('express')
    , exphbs  = require('express3-handlebars')
    , request = require('request')
    , fs = require('fs')
    , app = express()
    , port = process.env.PORT || 3000
    , io = require('socket.io').listen(app.listen(port))
    , hbs
    , pub = __dirname + '/public';

// BBY Key 'r29ttrcwgf4vc47gsz5a8z7r'
var key = 'r29ttrcwgf4vc47gsz5a8z7r';

// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(pub));
    app.use(express.errorHandler());
});

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {

    // request defaults
    var data,
        dataJSON = [],
        BBYurl = 'http://api.remix.bestbuy.com/v1/products(search=PS4&manufacturer=sony&categoryPath.name=PS4 Consoles)?format=json&apiKey=';

    request(BBYurl + key, function(error, response, body) {
        if ( !error && response.statusCode == 200 ) {
            dataJSON.push(body);

            try {
                data = JSON.parse(dataJSON.join(''));
            } catch(e){
                console.error('Error: ' + error);
            }

            res.render('home', {
                items: data.products,

                helpers: {
                    is: function (arg) {
                        if ( arg ) {
                            return ('Yes!! :)');
                        } else {
                            return ('No :(');
                        }
                    }
                }
            });


            fs.writeFile("/Users/free005304/Desktop/ps4logs", body, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The file was saved!");
                }
            });


        }

    });

    function requestData() {
        request(BBYurl + key, function(error, response, body) {

            if ( !error && response.statusCode == 200 ) {
                var newBody = [],
                    newData;

                newBody.push(body);

                try {
                    data = JSON.parse(dataJSON.join(''));
                    newData = JSON.parse(newBody.join(''));
                } catch(e){
                    console.error('Error: ' + error);
                }

                if ( newData.products.length != data.products.length ) {
                    io.sockets.emit('refreshBrowser', { data: true });
                }

            }

        });
    }

    var intervalId = setInterval(requestData, 4000);

});

console.log('express3-handlebars server listening on: 3000');
