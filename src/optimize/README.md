# Week 7 – Optimizing datasets for the web

Last week we worked with a ~5MB CSV dataset. A dataset of this size is too
large to serve directly to browsers as-is, but, as we're only interested in
a subset of the data, we can optimize it for the web.

## The task

Download the original datset from here.

- [Penn World Table version 10.0.csv](https://github.com/owid/owid-datasets/blob/master/datasets/Penn%20World%20Table%20version%2010.0/Penn%20World%20Table%20version%2010.0.csv)

Use [optimize.js](./optimize.js) as your starting point.

1. Make sure you have the dataset located in this directory. From this directory run the following:
2. `npm i`
3. `npm run dev`

This will auto-rerun the script whenever you save it. The script is already set
up to read the data in,output it to a new file and report the difference in filesize.

The task is to optimize this dataset for a project that requires a **_GDP timeseries dataset_**
for every country, based on the data in the first GDP column: `GDP (expenditure, multiple price benchmarks)`.

How small can you get the output dataset? You can use any technique you like here, as
long as you retain the data we're interested in at an acceptable level of accuracy.

## Notes

### Why optimize?

Page size is one of the biggest factors in page load time, and web users are an impatient bunch.
It's been [understood for many years](https://www.pingdom.com/blog/page-load-time-really-affect-bounce-rate/) that the increase in bounce-rate – and the resulting drop-off
in pageviews – is extremely steep when you're on the wrong side of this. In short, if you like people
seeing your work, it's good to keep this in mind!


### Compression

In the size output you'll see entries for "uncompressed" and "gzipped". The uncompressed size is
the size on disk or in memory, whereas the gzipped size is the size of the data after it has been
compressed using the [gzip algorithm](https://en.wikipedia.org/wiki/Gzip). Text files are usually
compressed in this way by a web server or CDN before being sent to the browser, so this is a good
indication of the amount of data that will be sent over the network.

### Over-optimization

Depending on how you chose to structure your output data the file size could vary dramatically.
At a certain point there will be diminishing returns for time spent versus gains made. This is an
exercise in optimization though, so over-optimization is welcome! The table below is a very rough
comment on the level of effort and difficulty required to reduce this dataset down to a given size,
based on retaining a precision of 1 decimal place in billions of dollars.

| Size (gzip) | Difficulty      |
| ----------: | --------------- |
|     < 100KB | ✅ Easymode     |
|      < 40KB | ⭐ Nice!!       |
|      < 25KB | 💪 Pro          |
|      < 20KB | 🧙‍♀️ Yer a wizard |
