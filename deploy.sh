set -e

echo "Cleaning up old build and cache files..."
# Vite's output is 'dist' by default, not 'build'
rm -rf dist
# Vite's cache directory is .vite
rm -rf node_modules/.cache .vite

echo "Installing dependencies..."
npm install

echo "Building project with Vite..."
npm run build

echo "Deploying to GitHub Pages..."
npm run deploy

echo "Committing and pushing changes..."
git add .
git commit -m "maintenance: migrate to vite and update deployment script"
git push origin main

echo "Deployment complete!"