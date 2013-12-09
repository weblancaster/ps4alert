var express = require('express')
    , exphbs  = require('express3-handlebars')
    , request = require('request')
    , fs = require('fs');

// App defaults
var app = express()
    , hbs
    , pub = '/public/';

// BBY Key 'r29ttrcwgf4vc47gsz5a8z7r'
var key = 'r29ttrcwgf4vc47gsz5a8z7r';

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
    request('http://api.remix.bestbuy.com/v1/products(search=PS4&manufacturer=sony&categoryPath.name=PS4 Consoles)?format=json&apiKey=' + key, function(error, response, body) {
        var data,
            dataJSON = [];

        if ( !error && response.statusCode == 200 ) {
            dataJSON.push(body);

            try {
                data = JSON.parse(dataJSON.join(''));
            } catch(e){
                console.error(e);
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

//            fs.writeFile("/Users/free005304/Desktop/ps4logs", body, function(err) {
//                if(err) {
//                    console.log(err);
//                } else {
//                    console.log("The file was saved!");
//                }
//            });

        }
    });
});

app.listen(3000);

console.log('express3-handlebars server listening on: 3000');
