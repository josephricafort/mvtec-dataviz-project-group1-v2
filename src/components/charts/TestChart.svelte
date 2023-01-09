    
<script>
    import { scaleBand, scaleLinear } from "d3-scale";
  import colors from "d3-scale-chromatic/src/colors";
  
    export let data; //data that needs to be imported when using the component
  
    //set width and height and margin manually for simplicity in testing
    const width = 800;
    const height = 600;

    const margin = { top: 20, right: 20, bottom: 20, left: 180 };

    const innerHeight = height - margin.top - margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    $: xDomain = data.map((d) => d.Year);
    $: yDomain = data.map((d) => d.Percentage);

    $: yScale = scaleBand()
                .domain(xDomain)
                .range([0, innerHeight]).padding(0.1);

    $: xScale = scaleLinear()
                .domain([0, Math.max.apply(null, yDomain)])
                .range([0, innerWidth]);
</script>

<svg {width} {height}>

  <g transform={`translate(${margin.left},${margin.top})`}>

    <!--use Svelte html looping to iterate over all ticks and create axis-->
    {#each xScale.ticks() as tickValue}
    
        <!--move along the x axis according to calculation by xScale, move 0 at yAxis-->
        <g transform={`translate(${xScale(tickValue)},0)`}>
        <line y2={innerHeight} stroke="black" />
        <text text-anchor="middle" dy=".71em" y={innerHeight + 2}>
          {tickValue}
        </text>
      </g>
    {/each}

    {#each data as d}
      <text
        text-anchor="end"
        x="-3"
        dy=".32em"
        y={yScale(d.Year) + yScale.bandwidth() / 2}
      >
        {d.Year}
      </text>
      <rect
        x="0"
        y={yScale(d.Year)}
        width={xScale(d.Percentage)}
        height={yScale.bandwidth()}
      />
    {/each}
  </g>
</svg>

