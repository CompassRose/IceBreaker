#!/bin/bash

# IceBreaker Angular Application Deployment Script

echo "ÌæÆ Deploying IceBreaker Angular Application with MongoDB Atlas..."

# Step 1: Check if we're in the right directory
if [ ! -f "lib/ice_breaker-cdk-stack.ts" ]; then
    echo "‚ùå Not in IceBreaker-CDK directory! Please run from IceBreaker-CDK folder."
    exit 1
fi

# Step 2: Build the Angular application
echo "Ì≥¶ Building Angular application..."
cd ../IceBreaker
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "‚ùå Angular build failed!"
    exit 1
fi

echo "‚úÖ Angular build completed successfully"

# Step 3: Return to CDK directory and build TypeScript
echo "Ì¥® Building CDK TypeScript..."
cd ../IceBreaker-CDK
npm run build

# Check if TypeScript build was successful
if [ $? -ne 0 ]; then
    echo "‚ùå CDK TypeScript build failed!"
    exit 1
fi

echo "‚úÖ CDK build completed successfully"

# Step 4: Deploy the CDK stack
echo "Ì∫Ä Deploying to AWS..."
npx cdk deploy --require-approval never

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "Ìæâ Deployment completed successfully!"
    echo "Ìºê Your IceBreaker game is now live on AWS!"
    echo ""
    echo "Ì≥ã Post-deployment checklist:"
    echo "1. ‚úÖ Angular application built and deployed"
    echo "2. ‚úÖ CloudFront distribution updated"
    echo "3. ‚úÖ MongoDB Atlas integration ready"
    echo "4. ‚úÖ High scores API deployed"
    echo ""
    echo "ÌæØ Access your game at: https://d3rolhqkkeo9dk.cloudfront.net"
    echo "Ì≥ä API Gateway URL will be shown in the CloudFormation outputs above"
else
    echo "‚ùå Deployment failed!"
    echo "Ì≤° Try running: npm run diff to see what changes will be made"
    exit 1
fi
