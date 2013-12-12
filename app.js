// App defaults
var express = require('express')
    , exphbs  = require('express3-handlebars')
    , app = express()
    , port = process.env.PORT || 3000
    , io = require('socket.io').listen(app.listen(port))
    , request = require('request')
    , fs = require('fs')
    , nodemailer = require('nodemailer')
    , NEdb = require('nedb')
    , usersDB = new NEdb({ filename: 'db/subscribed.db', autoload: true })
    , pub = __dirname + '/public';

// BBY Key 'r29ttrcwgf4vc47gsz5a8z7r'
var key = 'r29ttrcwgf4vc47gsz5a8z7r';

// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
    io.set('transports', [
        'websocket'
        , 'xhr-polling'
        , 'flashsocket'
        , 'htmlfile'
        , 'jsonp-polling'
    ]);
    io.set("polling duration", 10);
});

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(pub));
    app.use(express.errorHandler());
});

app.engine('handlebars', exphbs({
        defaultLayout: 'main'
    })
);

app.set('view engine', 'handlebars');

// request defaults
// search=PS4&manufacturer=sony&categoryPath.name=PS4 Consoles
var data,
    dataJSON = [],
    BBYurl = 'http://api.remix.bestbuy.com/v1/products(search=PS4)?format=json&apiKey=',
    emailBody = '',
    PS4available = 0;

app.get('/', function (req, res) {

    request(BBYurl + key, function(error, response, body) {
        if ( !error && response.statusCode == 200 ) {

            dataJSON = [];
            data = undefined;
            dataJSON.push(body);

            try {
                data = JSON.parse(dataJSON.join(''));
            } catch(e){
                console.error('Error on first load: ' + error);
            }

            res.render('home', {
                items: data.products,

                helpers: {
                    is: function (arg) {
                        if ( arg ) {
                            PS4available++
                            return ('Yes!! :)');
                        } else {
                            return ('No :(');
                        }
                    }
                }
            });

            checkToSendEmail();


//            fs.writeFile("/Users/free005304/Desktop/ps4logs1", body, function(err) {
//                if(err) {
//                    console.log(err);
//                } else {
//                    console.log("The file was saved!");
//                }
//            });


        }

    });

});

/**
 * Get data sent by user
 */
app.post('/', function(req, res) {
    var email = req.body.email,
        exist = null,
        document = {
            email: email
        };

    usersDB.find({ email: email }, function (err, docs) {
        for ( var i = 0; i < docs.length; i++ ) {
            if ( email === docs[i].email ) {
                exist = true
                break;
            } else {
                exist = false;
            }
        }

        if ( !exist ) {
            usersDB.insert(document);
            res.redirect('/');
        } else {
            io.sockets.emit('refreshBrowser', { data: false });
        }
    });
});

/**
 * Initialize long polling to check BBY open data for each one minute
 * @method requestData
 */
var intervalId = setInterval(requestData, 60000);

function requestData() {
    request(BBYurl + key, function(error, response, body) {

        if ( !error && response.statusCode == 200 ) {
            var newBody = [],
                newData;

            newBody.push(body);

            try {
                newData = JSON.parse(newBody.join(''));
            } catch(e){
                console.error('Error on request data: ' + error);
            }

            if ( newData.products.length != data.products.length ) {
                io.sockets.emit('refreshBrowser', { data: true });
            }

            checkToSendEmail();

        }

    });
}

/**
 * Check how many PS4's are available if there's more than 1
 * build html email and finally send email alert
 * @method checkToSendEmail
 */
function checkToSendEmail() {
    if ( PS4available > 0 ) {
        for ( var i = 0; i < data.products.length; i++ ) {
            emailBody += ' <p><strong>PlayStation 4 available</strong> at Best Buy <a href=" ' + data.products[i].url + ' " > link: ' + data.products[i].url + ' </a> </p> <br/><br/> ';
        }
        sendEmail();
    }
}

/**
 * Start to handle email
 *
 */
var myService = 'Gmail',
    myUser = 'michaell.llancaster@gmail.com',
    myPass = 'Logitech10';

var smtpTransport = nodemailer.createTransport('SMTP',{
    service: myService,
    auth: {
        user: myUser,
        pass: myPass
    }
});

/**
 * Configure email and than sends it
 * @method sendEmail
 */
function sendEmail() {

    usersDB.find({}, function (err, docs) {
        var dataFormatted = docs.join(', ');

        smtpTransport.sendMail({
            from: myUser, // sender address
            to: dataFormatted, // comma separated list of receivers
            subject: "Playstation 4 available!!", // Subject line
            html: emailBody // html body
        }, function(error, response){
            if ( error ) {
                console.log(error);
                console.log('Recipients: ' + dataFormatted)
            } else {
                console.log("Message sent: " + response.message);
                clearInterval(intervalId);
            }
        });
    });

}

console.log('express3-handlebars server listening on: 3000');
