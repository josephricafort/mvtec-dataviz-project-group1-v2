<script>
    import {line, curveBasis} from 'd3-shape';
	import {scaleLinear, scaleUtc} from 'd3-scale';
	import {max, extent} from 'd3-array'
    import RUdata from "../data/clean_RussianImports.json";
    
    export let filter;
    $: highlight = "Germany";
    
    const height = 400
    const width = 600
    const margin = { top: 20, right: 20, bottom: 20, left: 60 }

    const innerHeight = height - margin.top - margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    let colour = "black";
    let opacity = "0.0";

    $: data = RUdata.filter(d => d.Fossil_Fuel == filter)
    $: countries = [...new Set(data.map(d => d.Country))]

    $: xScale = scaleLinear()
        .domain([1990, 2021])
        .range([margin.left, width - margin.right])

    $: yScale = scaleLinear()
        .domain([0, max(data.map(d => d.Percentage))])
        .range([height - margin.bottom, margin.top])

    $: colorScale = (country) => {if (country == highlight) {
        return "blue"
    } else {
        return "grey"
    }}

    $: opacityScale = (country) => {if (country == highlight) {
        return "1.0"
    } else {
        return "0.0"
    }}

    $: strokeScale = (country) => {if (country == highlight) {
        return 2.5;
    } else {
        return 1.5;
    }}

    $: linePath = (keyYear, keyFF) => line()
        .curve(curveBasis)
        .x(d => xScale(d[keyYear]))
        .y(d => yScale(d[keyFF]))
   
</script>

<div class="imports-line">
   <!-- <h3>Do what degree to countries rely on {filter} imports from Russia?</h3>-->
   <section class="menu-cont">
    <select class="menu" 
                    name="menu" 
                    id="menu" 
                    bind:value={highlight}>
        <option value="" selected>Select a country.</option>
        {#each countries as country}
            <option value={country}>{country}</option>
        {/each}
    </select>
    </section>
    <svg
        {width}
        {height}
        viewBox={[0, 0, width, height]}>
        <g>
            <!--use Svelte html looping to iterate over all ticks and create axis-->
        {#each [1990, 1995, 2000, 2005, 2010, 2015, 2020] as tickValue}
            <!--move along the x axis according to calculation by xScale, move 0 at yAxis-->
            <g transform={`translate(${xScale(tickValue)},0)`}>
            <line y2={innerHeight}
            stroke="#333333"
            stroke-width="1"/>
            <text text-anchor="middle" dy="18" y={innerHeight +18}>
            {tickValue}
            </text>
            </g>
        {/each}

        {#each yScale.ticks() as tickValue}
            {#if tickValue}
                <g transform={`translate(0,${yScale(tickValue)})`}>
                <text text-anchor="end" dy=".71em" x={margin.left}>
                    {tickValue}
                </text>
                </g>
            {/if}
        {/each}
     
        <text text-anchor="end" dy=".71em" x={margin.left} y={margin.top}>%</text>

        {#each countries as country, i}
            <path
                d={linePath("Year", "Percentage")(data.filter(d => d.Country === country))}
                stroke={colorScale(country)}
                fill="none"
                stroke-width={strokeScale(country)} 
            />      
        {/each}
        </g>
    </svg>
</div>

<style></style>