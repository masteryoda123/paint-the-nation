var express = require('express');
var unirest = require('unirest');
var router = express.Router();
var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'yudalucasyami',
    password : 'yudalucasyami123',
    database : 'potuspredictor'
});



/* GET  */
router.get('/', function(req, res, next) {

    var getSentiment = function(target, text, callback) {

        var target = encodeURIComponent(target);
        var text = encodeURIComponent(text);

        var textSentiment = unirest.get('https://alchemy.p.mashape.com/text/TextGetTargetedSentiment?outputMode=json&target=' + target + '&text=' + text)
        .header("X-Mashape-Key", "rB7o3DosBdmshV34lJQAvARhMWNVp1FtTfNjsnL7W8x34AxE3m")
        .header("Accept", "text/plain")
        .end(function (result) {
            callback(result.body.docSentiment.score); // Make this only return the numerical value
        });
    };


    var CANDIDATES = ['Santorum', 'Rubio', 'Paul', 'Pataki', 'Kasich', 'Jindal', 'Trump',
            'Sanders', 'Clinton', 'Webb', 'O\'Malley', 'Chafee', 'Bush', 'Carson',
            'Christie', 'Cruz', 'Fiorina', 'Gilmore', 'Graham', 'Huckabee'];

    for (var i = 0; i < CANDIDATES.length; i++) {
        var currCandidate = CANDIDATES[i];
        // query from database
        connection.query('SELECT Text, Candidate, Evald FROM Tweets WHERE Evald = 0 AND Candidate = '
                +  currCandidate + ' ORDER BY State', function(err, rows, fields) {
                if (err) throw err;
                console.log('Tweets are now filtered by ' + currCandidate
                    + ' and ordered by state.');

                    // Concatenate tweets together by state
                    var state = row[0].State;
                    var appendedTweet = '';
                    var index = 0;
                    var numTweets = 0;

                    do {
                        appendedTweet = string.concat(appendedTweet, '\n', row[index].Text);  // fix
                        numTweets++;
                        index++;
                    } while(state === row[index].State);

                    // Run through sentiment analysis
                    getSentiment(currCandidate, appendedTweet, function(result) {
                        // check if row is already made
                        connection.query('SELECT * WHERE State = ' + state + ' AND Candidate = ' + currCandidate, function(err, rows, fields) {
                            if (err) throw err;
                            // row does not exist
                            if (rows.length === 0) {
                                connection.query('INSERT INTO Sentiments VALUES ('
                                    + state + ', ' + currCandidate + ', ' + result + ',' + numTweets + ')', function(err) {
                                        if (err) throw err;
                                    });
                            } else {
                                // row already exists; update old sentiment value using weighted average
                                var total = row[1].NumTweets + numTweets;
                                var sentimentValue = row[1].SenVal * (row[1].NumTweets / total) + result * (numTweets / total);
                                connection.query('UPDATE Sentiments SET SenVal = ' + sentimentValue + ', NumTweets = ' + total, function(err) {
                                    if (err) throw err;
                                });
                            }
                        });
                    });
                    state = row[index].State;
                    appendedValue = '';
                    numTweets = 0;
            });
    }
});

module.exports = router;

/*

GET https://alchemy.p.mashape.com/text/TextGetTargetedSentiment

*/
