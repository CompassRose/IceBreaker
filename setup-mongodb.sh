#!/bin/bash

echo "ÌΩÉ Setting up MongoDB Atlas integration for IceBreaker..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "‚ùå AWS CLI is not installed. Please install it first."
    echo "Ì≥ã Instructions: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

echo "Ì≥ù Please provide your MongoDB Atlas information:"

# Get MongoDB Project ID
read -p "MongoDB Atlas Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo "‚ùå Project ID is required"
    exit 1
fi

# Get MongoDB Connection String
read -p "MongoDB Connection String (mongodb+srv://...): " CONNECTION_STRING
if [ -z "$CONNECTION_STRING" ]; then
    echo "‚ùå Connection string is required"
    exit 1
fi

# Get API Keys
read -p "MongoDB Atlas Public API Key: " PUBLIC_KEY
if [ -z "$PUBLIC_KEY" ]; then
    echo "‚ùå Public API key is required"
    exit 1
fi

read -s -p "MongoDB Atlas Private API Key: " PRIVATE_KEY
echo
if [ -z "$PRIVATE_KEY" ]; then
    echo "‚ùå Private API key is required"
    exit 1
fi

echo "Ì¥ê Creating AWS Secrets Manager secret..."

# Create the secret
SECRET_VALUE=$(cat <<EOL
{
    "connectionString": "$CONNECTION_STRING",
    "publicKey": "$PUBLIC_KEY",
    "privateKey": "$PRIVATE_KEY"
}
EOL
)

aws secretsmanager create-secret \
    --name "mongodb-atlas-api-key" \
    --description "MongoDB Atlas API credentials for IceBreaker High Scores" \
    --secret-string "$SECRET_VALUE" \
    --region us-west-2

if [ $? -eq 0 ]; then
    echo "‚úÖ Secret created successfully!"
else
    echo "‚ö†Ô∏è Secret might already exist. Updating it..."
    aws secretsmanager update-secret \
        --secret-id "mongodb-atlas-api-key" \
        --secret-string "$SECRET_VALUE" \
        --region us-west-2
fi

echo "Ì≥ù Updating CDK stack with your Project ID..."

# Update the CDK stack file
sed -i.bak "s/your-mongodb-project-id/$PROJECT_ID/g" lib/ice_breaker-cdk-stack.ts

if [ $? -eq 0 ]; then
    echo "‚úÖ CDK stack updated successfully!"
    echo "Ì∫Ä Ready to deploy! Run: ./deploy.sh"
else
    echo "‚ùå Failed to update CDK stack. Please manually replace 'your-mongodb-project-id' with '$PROJECT_ID' in lib/ice_breaker-cdk-stack.ts"
fi

echo ""
echo "ÌæØ Next steps:"
echo "1. Verify your MongoDB Atlas cluster is running"
echo "2. Ensure your Atlas project allows AWS access"
echo "3. Run: ./deploy.sh to deploy with MongoDB integration"
echo ""
echo "Ì≥ö MongoDB Atlas Setup Guide:"
echo "https://docs.atlas.mongodb.com/getting-started/"
