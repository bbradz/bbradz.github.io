set -e

echo "Cleaning up old build and cache files..."
rm -rf build
rm -rf node_modules/.cache
rm -rf node_modules/.parcel-cache

echo "Installing dependencies..."
npm install

echo "Building project..."
npm run build

echo "Deploying project..."
npm run deploy

echo "Committing and pushing changes..."
git add .
git commit -m "maintenance"
git push origin main

echo "Deployment complete!"
