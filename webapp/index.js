exports.handler = function (event, context, callback) {

    // Load the SDK for JavaScript
    var AWS = require('aws-sdk');
    //  var nodemailer = require('nodemailer');
    var ses = new AWS.SES();
    // Set the region 
    AWS.config.update({
        region: 'us-east-1'
    });

    //Set the domain name from the environment variable
    var domain = process.env.DOMAIN_NAME;
    domain = domain.substring(0, domain.length - 1);
    console.log("Domain is " + domain);
    if (null == domain) {
        domain = "example.com";
    }

    var message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);

    //Added to make an entry to Dynamo DB
    //Create the DynamoDB service object
    var ddb = new AWS.DynamoDB({
        apiVersion: '2012-10-08'
    });
    var expiryTime = 1; //1 minutes
    var ttl = (new Date).getTime() + (expiryTime * 60 * 1000); //Adding 20 mins to the current timestamp

    const docClient = new AWS.DynamoDB.DocumentClient();

    //First check if the email is present in the table
    var params = {
        ExpressionAttributeNames: {
            "#username": "username"
        },
        ExpressionAttributeValues: {
            ":username": message.email
        },
        FilterExpression: "#username = :username and attribute_not_exists(Removed)",
        Limit: 20,
        TableName: "csye6225",
        ScanIndexForward: false
    };

   sendEmail();
    function addCredentials() {
        var params2 = {
            TableName: 'csye6225',
            Item: {
                'id': {
                    S: token
                },
                'username': {
                    S: message
                },
                'ttl': {
                    S: "" + ttl
                }
            }
        };

        // Call DynamoDB to add the item to the table
        ddb.putItem(params2, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Success", data);
            }
        });
    }

    function sendEmail() {
        var eParams = {
            Destination: {
                // ToAddresses: [message.email]
                ToAddresses: ["nisargpatel6895@gmail.com"]
            },
            Message: {
                Body: {
                    Text: {
                        // Data: message.rows
                        Data: "message.rows"
                    }
                },
                Subject: {
                    Data: "Bills due:"
                }
            },
            Source: "donotreply@" + domain
        };
        console.log('===SENDING EMAIL===');
        var email = ses.sendEmail(eParams, function (err, data) {
            if (err) {
                console.log(err);
                context.fail(err);
            } else {
                console.log("===EMAIL SENT===");
                console.log('EMAIL: ', email);
                console.log(data);
                context.succeed(event);
            }

        });
    }
};