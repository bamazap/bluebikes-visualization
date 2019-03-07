# Life-of-a-Blue-Bike

## Usage
- `npm run serve` hosts the project at `localhost:8080`
- `npm run build` transpiles the code to the `dist` folder

Note that the visualization will not work when opening `index.html` directly
since we load the data asynchronously and browsers think this violates the
same-origin policy when it is done using the file protocol. It should work on
GitHub pages just fine.

The `dist` folder is in `.gitignore`; eventually we will add a script to push it
to a `gh-pages` branch.
