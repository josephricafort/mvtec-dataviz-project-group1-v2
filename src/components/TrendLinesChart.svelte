<script>
    import * as aq from "arquero";
    import trendData from "../data/trendData.json"
    import {line, curveCatmullRom} from 'd3-shape';
	import {scaleLinear} from 'd3-scale';
	import {median, extent, range} from 'd3-array'
    import {schemeCategory10} from "d3-scale-chromatic";

    const height = 500
    const width = 600
    const margin = { top: 20, right: 20, bottom: 30, left: 20 }

    const trendInds = Object.keys(trendData[0]).slice(2)
    const ffInds = trendInds.slice(0, 6)
    const ffTotalInds = ffInds.slice(0, 3)
    const ffPercapInds = ffInds.slice(3, 6)

    const continents = [...new Set(trendData.map(d => d.cont))]

    let toggleffPercap = false
    $: selectFFInds = !toggleffPercap ? ["meanTotal", ...ffTotalInds] : ["meanPerCap", ...ffPercapInds]
    let selectFFValue = "meanTotal"
    
    $: linesData = aq.from(trendData)
        .derive(trendInds.reduce((obj, ind) => {
            return {...obj, [ind]: aq.escape(d => {
            if(d[ind]){
                const [b, e] = d[ind].split("e")
                return b * Math.pow(10, e)
            } 
            // else if(!!d.gdp) return 0
            })}
        }, {}))
        // World data has no values for gdp, remove data that
        // has no values for the gdp
        .filter(aq.escape(d => !!d.gdp ))
        .derive({ 
            date: aq.escape(d => new Date(d.yr, 1, 1)),
            meanTotal: aq.escape(d => ffTotalInds.reduce((mean, ind) => {
            return (mean + d[ind])/2
            }, 0)),
            meanPerCap: aq.escape(d => ffPercapInds.reduce((mean, ind) => {
            return (mean + d[ind])/2
            }, 0)),
        })
        // .relocate( "date", { before: "yr" })
        .select(aq.not("yr"))
        .objects()

    const xScaleLines = scaleLinear()
        .domain([0, 1])
        .range([margin.left, width - margin.right])

    const yScaleLines = scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top])

    $: linePath = (keyFF, keyEcon) => line()
        // .defined(d => !isNaN(d[keyEcon]) && !isNaN(d[keyFF]))
        .curve(curveCatmullRom)
        .x(d => xScaleLines(d[keyFF]))
        .y(d => yScaleLines(d[keyEcon]))

    const SEL_ECON_IND = "gdp"

    // Every continent specific
    $: linesContiData = conti => linesData.filter(d => d["cont"] === conti)
    $: yrExtent = conti => extent(linesContiData(conti), d => d.date.getFullYear())
    $: yrMid = conti => median(linesContiData(conti), d => d.date.getFullYear())

    $: contiLinePath = conti => linePath(selectFFValue, SEL_ECON_IND)(linesContiData(conti))

    $: markersData = conti => linesContiData(conti)
        .filter(d => [...yrExtent(conti), yrMid(conti)].includes(d["date"].getFullYear()))

    // Axes tick values
    $: xValRange = range(0, 1 + 1/5, 1/5).map(x => x.toPrecision(1))
    $: yValRange = range(0, 1 + 1/5, 1/5).map(y => y.toPrecision(1))

    // Encode legend labels
    const TWH = "Production (TWh)"
    const PC_KWH = "Production per capita (kWh)"
    $: energyUnit = !toggleffPercap ? TWH : PC_KWH
    $: encodeInd = (ind) => {
        switch(ind) {
            case selectFFInds[0]: return `Total ${energyUnit}`;
            case selectFFInds[1]: return `Coal ${energyUnit}`;
            case selectFFInds[2]: return `Gas ${energyUnit}`;
            case selectFFInds[3]: return `Oil ${energyUnit}`;
            case selectFFInds[4]: return `Renewable ${energyUnit}`;
            default: return "";
        }
    }

</script>

<div class="trend-line-chart">
    <div class="ui-controls">
        <input type="checkbox" id="toggle-ff-percap" name="Show per capita value" bind:checked={toggleffPercap}>
        <label for="toggle-ff-percap">Show per capita value</label>
        <div class="select-ff-indicator">
            {#each selectFFInds as selectFF}
                <label>
                    <input type="radio" bind:group={selectFFValue} name="ffInds" value={selectFF}>
                    {encodeInd(selectFF)}
                </label>
            {/each}
        </div>
    </div>
    <div class="legends">
        {#each continents as conti, i}
            <div class="legend-container">
                <div class="legend-color" style={`background-color: ${schemeCategory10[i]};`}></div>
                <span class="">{conti}</span>
            </div>
        {/each}
    </div>
    <svg
        class="trend-line-chart"
        {width}
        {height}
        viewBox={`0, 0, ${width}, ${height}`}
    > 
        <g class="conti-shapes">
            {#each continents as conti, i}
                <g class="paths-group">
                    <path
                        class="conti-path"
                        d={contiLinePath(conti)}
                        stroke={schemeCategory10[i]}
                        fill="none"
                        stroke-width={conti === "World" ? 3 : 1.5}
                    />
                </g>
                <g class="markers-group">
                    {#each markersData(conti) as mData}
                        <g class="dots-group">
                            <circle
                                cx={xScaleLines(mData[selectFFValue])}
                                cy={yScaleLines(mData[SEL_ECON_IND])}
                                r={conti === "World" ? 4 : 2}
                                fill={schemeCategory10[i]}
                                stroke="none"
                            />
                        </g>
                        <g class="year-labels-group">
                            <text
                                x={xScaleLines(mData[selectFFValue])}
                                y={yScaleLines(mData[SEL_ECON_IND])}
                                fill={schemeCategory10[i]}
                                font-size="12"
                            >
                                {mData["date"].getFullYear()}
                            </text>
                        </g>
                    {/each}
                </g>
            {/each}
        </g>
        <g class="axes">
            <line
                class="horizontal-rule"
                x1={margin.left}
                x2={width - margin.right}
                y1={height - margin.bottom}
                y2={height - margin.bottom}
                stroke="#333333"
                stroke-width="1"
            />
            <g class="x-axis">
                {#each xValRange as xVal}
                    <text
                        x={xScaleLines(xVal)}
                        y={height - margin.bottom}
                        dy="18"
                        text-anchor="middle"
                    >
                        {xVal}
                    </text>
                {/each}
            </g>
            <g class="y-axis">
                {#each yValRange as yVal}
                    {#if yVal > 0}
                        <text
                            x={margin.left}
                            y={yScaleLines(yVal)}
                            dy="18"
                            text-anchor="start"
                        >
                            {yVal}
                        </text>
                    {/if}
                {/each}
            </g>
        </g>
        <g class="grid">
            <g class="horizontal-lines">
                {#each yValRange as yVal}
                    <line
                        x1={margin.left}
                        x2={width - margin.right}
                        y1={yScaleLines(yVal)}
                        y2={yScaleLines(yVal)}
                        stroke="#cccccc"
                        stroke-width="0.5"
                    >
                        {yVal}
                    </line>
                {/each}
            </g>
            <g class="vertical-lines">
                {#each xValRange as xVal}
                    <line
                        x1={xScaleLines(xVal)}
                        x2={xScaleLines(xVal)}
                        y1={margin.top}
                        y2={height - margin.bottom}
                        stroke="#cccccc"
                        stroke-width="0.5"
                    >
                        {xVal}
                    </line>
                {/each}
            </g>
        </g>
    </svg>
</div>

<style>
.trend-line-chart {
    margin: 20px auto;
    font-size: 14px;
}

.ui-controls {
    padding: 10px;
    border: 1px solid #ccc;
    margin: 5px 0;
    text-align: left;
}

.select-ff-indicator label {
    margin-right: 10px;
}

.legends {
    display: flex;
    flex-flow: row;
    align-items: center;
    padding: 5px;
    border: 1px solid #ccc;
    margin: 5px 0;
}

.legend-container {
    padding: 5px 10px;
}

.legend-color {
    height: 3px;
    width: 10px;
    display: inline-block;
    vertical-align: middle;
}
</style>