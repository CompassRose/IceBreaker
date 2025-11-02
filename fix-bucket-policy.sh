#!/bin/bash

echo "í´§ Fixing S3 bucket policy for CloudFront access..."

# Get the OAI canonical user ID from the deployed stack
OAI_ID=$(aws cloudformation describe-stacks --stack-name IceBreakerCdkStack --query "Stacks[0].Outputs[?OutputKey=='BucketPolicyInfo'].OutputValue" --output text | grep -o 'E[A-Z0-9]*')

if [ -z "$OAI_ID" ]; then
    echo "âŒ Could not retrieve OAI ID from CloudFormation stack"
    echo "í´„ Deploying CDK stack first to get OAI ID..."
    npx cdk deploy --require-approval never
    OAI_ID=$(aws cloudformation describe-stacks --stack-name IceBreakerCdkStack --query "Stacks[0].Outputs[?OutputKey=='BucketPolicyInfo'].OutputValue" --output text | grep -o 'E[A-Z0-9]*')
fi

echo "í³‹ Using OAI Canonical User ID: $OAI_ID"

# Create bucket policy JSON
cat > bucket-policy.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::amzn-game-tester/*"
        }
    ]
}
EOL

echo "í»¡ï¸ Applying bucket policy to amzn-game-tester..."
aws s3api put-bucket-policy --bucket amzn-game-tester --policy file://bucket-policy.json

if [ $? -eq 0 ]; then
    echo "âœ… Bucket policy applied successfully!"
    echo "í´„ Invalidating CloudFront cache..."
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name IceBreakerCdkStack --query "Stacks[0].Outputs[?OutputKey=='IceBreakerUrl'].OutputValue" --output text | sed 's/https:\/\///' | sed 's/\.cloudfront\.net//')
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo "í¾‰ Your IceBreaker game should now be accessible!"
else
    echo "âŒ Failed to apply bucket policy"
    exit 1
fi

# Clean up
rm bucket-policy.json

echo "í¼ Try accessing your game at: https://d3rolhqkkeo9dk.cloudfront.net"
