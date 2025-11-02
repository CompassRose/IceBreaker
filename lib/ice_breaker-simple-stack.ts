import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class IceBreakerSimpleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing S3 bucket
    const websiteBucket = s3.Bucket.fromBucketName(this, 'IceBreakerWebsiteBucket', 'amzn-game-tester');

    // Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'IceBreakerOAI', {
      comment: 'OAI for IceBreaker Angular Application'
    });

    // CloudFront distribution for global content delivery
    const distribution = new cloudfront.Distribution(this, 'IceBreakerDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(websiteBucket, {
          originAccessIdentity: originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(30),
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Simple Lambda function for high scores API (using DynamoDB or local storage fallback)
    const highScoresLambda = new lambda.Function(this, 'HighScoresFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Simple in-memory storage for demo (replace with DynamoDB in production)
        const mockHighScores = [
            { playerName: "IceFisher", score: 15000, targetNumber: 87, attempts: 3, timestamp: new Date('2024-01-15'), gameType: 'ice-fishing' },
            { playerName: "PolarBear", score: 12500, targetNumber: 73, attempts: 4, timestamp: new Date('2024-01-14'), gameType: 'ice-fishing' },
            { playerName: "ArcticAce", score: 10000, targetNumber: 56, attempts: 5, timestamp: new Date('2024-01-13'), gameType: 'ice-fishing' }
        ];

        if (event.httpMethod === 'POST') {
            const { playerName, score, targetNumber, attempts } = JSON.parse(event.body);
            
            // In a real implementation, you would save to DynamoDB here
            console.log('New high score:', { playerName, score, targetNumber, attempts });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'High score recorded!',
                    id: Date.now().toString()
                })
            };
        } else if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(mockHighScores)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
      `),
      timeout: cdk.Duration.seconds(30)
    });

    // API Gateway for high scores endpoints
    const api = new apigateway.RestApi(this, 'HighScoresApi', {
      restApiName: 'IceBreaker High Scores API',
      description: 'API for managing IceBreaker game high scores',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type']
      }
    });

    const highScoresResource = api.root.addResource('highscores');
    highScoresResource.addMethod('GET', new apigateway.LambdaIntegration(highScoresLambda));
    highScoresResource.addMethod('POST', new apigateway.LambdaIntegration(highScoresLambda));

    // Deploy the Angular application to S3
    new s3deploy.BucketDeployment(this, 'IceBreakerDeployment', {
      sources: [s3deploy.Source.asset('../IceBreaker/dist/ice-breaker')],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'IceBreakerUrl', {
      value: `https://${distribution.domainName}`,
      description: 'URL of the IceBreaker Angular Application',
    });

    new cdk.CfnOutput(this, 'HighScoresApiUrl', {
      value: api.url,
      description: 'URL of the High Scores API',
    });

    new cdk.CfnOutput(this, 'BucketPolicyInfo', {
      value: `Add this principal to your bucket policy: ${originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId}`,
      description: 'CloudFront OAI canonical user ID for bucket policy',
    });
  }
}
