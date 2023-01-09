<script>
	import PointInteractive from '../common/PointInteractive.svelte';
	import {line, curveStep} from 'd3-shape';
    import {scaleTime, scaleLinear} from 'd3-scale';
    import {max, extent} from 'd3-array'
    import { Delaunay } from 'd3-delaunay'
    
    export let data;
    export let x;
    export let y;
	export let margin = {top: 20, right: 5, bottom: 20, left: 5};
	export let key;
    export let color;
    export let title;
	export let desc;
	export let layout;

	let datum, width, height;
    
    const _data = key.y.map( (key, i) => data.map(d => ({x: d.time, y: d[key], key:key, color: color[i]} )))
		
	$: xScale = scaleTime()
		.domain(extent(data.x))
		.range([margin.left, width - margin.right]);
	
	$: yScale = scaleLinear()
		.domain([0, max(data.y)])
		.range([height - margin.bottom - margin.top, margin.top]);
    
    $: xAxis = d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0);

    $: yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

	$: path = line()
		.x(d => xScale(d.x))
		.y(d => yScale(d.y))
        .curve(curveStep);

    $: delaunay = Delaunay.from(_data.flat(), d => x(d.x), d => y(d.y))

	const mouseMove = (m) => {
        const mX = (m.offsetX) ? m.offsetX : m.clientX;
        const mY = (m.offsetY) ? m.offsetY : m.clientY;
        const picked = delaunay.find(mX, mY);
        datum = _data.flat()[picked];
	}

	const leave = (m) => {
		datum = undefined;
    }
    
    $: hilite = (key) => {
        if(datum !== undefined) return (datum.key === key) ? 1 : .3 ;
        else return 1;
    }

</script>

<div class='graphic {layout}' bind:clientWidth={width} bind:clientHeight={height}>
    {#if width}
    <svg xmlns:svg='https://www.w3.org/2000/svg' 
        viewBox='0 0 {width} {height}'
        {width}
        {height}
        role='img'
        aria-labelledby='title desc'
        on:touchmove|preventDefault
        on:pointermove|preventDefault={mouseMove}
        on:mouseleave={leave}
        on:touchend={leave}
        >
        <title id='title'>{title}</title>
        <desc id='desc'>{desc}</desc>
        <g>
            {#each _data as d}
            <path 
                d={path(d)}
                stroke={d[0].color}
                fill='none'
                opacity={hilite(d[0].key)}
            />
            {/each}
        </g>
    
        <!--<yAxis {width} {height} {margin} scale={y} position='left' format={format.y} />
        <xAxis {width} {height} {margin} scale={x} position='bottom' format={format.x} />
    
        <PointInteractive {datum} {format} {x} {y} key={{x:'x', y:'y'}} {width} />-->
        
    </svg>
    {/if}
</div>

<style>
    path {
        transition: opacity .3s;
    }
</style>