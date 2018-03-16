'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cisp = new AWS.CognitoIdentityServiceProvider();

module.exports.routeRead = (event, context, callback) => {
	const timestamp = new Date().getTime();
	cisp.getUser({
		"AccessToken" : event.query.accessToken
	}, (error, result) => {
		if (error) {
			console.log(error);
			callback(null, {
				statusCode : error.statusCode || 501,
				headers : {
					'Content-Type' : 'text/plain'
				},
				body : 'Couldn\'t retrieve the user by the Access Token!',
			});
			return;
		} else {			
			const params = {
				TableName : process.env.ROUTE_TABLE
			};
			
			if ( event.path.type ) {
				switch (event.path.type) {
					case 'my':
						params.FilterExpression = "#userId = :username";
						params.ExpressionAttributeNames = { "#userId" : "userId" };
						params.ExpressionAttributeValues = { ":username" : result.Username };
						break;
					case 'others':
						params.FilterExpression = "#userId <> :username";
						params.ExpressionAttributeNames = { "#userId" : "userId" };
						params.ExpressionAttributeValues = { ":username" : result.Username };
						break;
					default:
						break;
				}
			}
			dynamoDb.scan(params, function(err, data) {
				if (err) {
					console.log(err);
					callback(err);
				} else {
					const response = {
		    	      statusCode: 200,
		    	      body: data.Items
		    	    };
					callback(null, response);
				}
			});
		}
	});
};