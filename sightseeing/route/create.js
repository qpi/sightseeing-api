'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cisp = new AWS.CognitoIdentityServiceProvider();

module.exports.routeCreate = (event, context, callback) => {
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
			console.log(result);
			const item = Object.assign({
				id : uuid.v1(),
				userId : result.Username,
				createdAt : timestamp,
				updatedAt : timestamp
			}, event.body);

			const params = {
				TableName : process.env.ROUTE_TABLE,
				Item : item
			};

			dynamoDb.put(params, (error) => {
				if (error) {
					console.error(error);
					callback(null, {
						statusCode : error.statusCode || 501,
						headers : {
							'Content-Type' : 'text/plain'
						},
						body : 'Couldn\'t create the route item into the database!',
					});
					context.succe
					return;
				}

				const response = {
					statusCode : 201,
					body : JSON.stringify(item)
				};
				callback(null, response);
			});
		}
	});
};