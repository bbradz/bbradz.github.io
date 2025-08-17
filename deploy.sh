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

echo "Building project with Vite..."
npm run build

echo "Creating a 404.html fallback for GitHub Pages..."
cp dist/index.html dist/404.html

echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deploying to GitHub Pages..."
npm run deploy

echo "Committing and pushing changes..."
git add .
git commit -m "vite changes pt 2"
git push origin main

echo "Deployment complete!"