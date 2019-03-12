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

## Todo

Show flow, not accumulation of bikes 
Allow people to filter down by specific dates

- Add more data/preprocess the data to make loading times manageable 
- Add ability to filter based on time of day (to the hour) and day of the week 
- Filter based on geography. If you select a geographic area, you filter down only to bikes entering or leaving that area (toggle?)
- fix how data is aggregated over multiple days
- add animation to make the circles smoothly increase or decrease in size
- let people choose a specific day or aggreate over days of the week, days of the month, 
  time of day, etc
