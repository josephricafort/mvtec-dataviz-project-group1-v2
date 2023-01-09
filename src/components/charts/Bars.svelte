<script>
	import Axis from '../common/Axis.svelte';
	import PointInteractive from '../common/PointInteractive.svelte';
	import {area, curveStep} from 'd3-shape';
	import {scaleLinear, scaleBand} from 'd3-scale';
	import {max, extent} from 'd3-array'
    
    export let data;
	export let margin = {top: 20, right: 5, bottom: 20, left: 5};
	export let key;
	export let color;
	export let title;
	export let desc;
	export let layout;

	let datum, width, height;
	height = 120;
    $: barwidth = (width - margin.left - margin.right) / data.length;
		
	$: x = scaleBand()
		.domain(data.map((d,i) => String(i)))
		.range([margin.left, width - margin.right]);
	
	$: y = scaleLinear()
		.domain([0, max(data, d => d[key.y])])
		.range([height - margin.bottom - margin.top, margin.top]);

</script> 

<div class='graphic {layout}' bind:clientWidth={width} bind:clientHeight={height}>
{#if width}
<svg xmlns:svg='https://www.w3.org/2000/svg' 
	viewBox='0 0 {width - margin.right - margin.left} {height}'
	{width}
	{height}
	role='img'
	aria-labelledby='title desc'
	>
	<title id='title'>{title}</title>
	<desc id='desc'>{desc}</desc>
    {#each data as d,i}
		<rect 
			height={height - y(d[key.y]) }
            width={x.bandwidth()}
            y={y(d[key.y])}
            x={x(String(i))}
			fill={color}
			stroke='none'
		/>
    {/each}

	<!-- <Axis {width} {height} {margin} scale={y} position='left' format={format.y} /> -->
	<!-- <Axis {width} {height} {margin} scale={x} position='bottom' format={format.x} /> -->

	<!-- <PointInteractive {datum} {format} {x} {y} {key} {width} /> -->
	
</svg>
{/if}
</div>