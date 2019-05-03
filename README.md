# How People Use Bluebikes

[6.894 (Interactive Data Visualization)](http://vis.mit.edu/classes/6.894/) Assignment 3

by Anelise Newman and Barry McNamara

## Usage
- `npm run serve` hosts the project at `localhost:8080`
- `npm run build` transpiles the code to the `dist` folder

Note that the visualization will not work when opening `index.html` directly
since we load the data asynchronously and browsers think this violates the
same-origin policy when it is done using the file protocol. It works on
GitHub pages just fine.

The `dist` folder is not in `.gitignore`; the project must be rebuilt and the
`dist` folder must be updated on GitHub to update the GitHub Pages version. 
