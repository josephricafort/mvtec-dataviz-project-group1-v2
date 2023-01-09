<script>
    import * as aq from "arquero";
    import ffRenData from "../data/ffRenData.json"
    import {area, stack} from 'd3-shape';
	import {scaleLinear, scaleUtc} from 'd3-scale';
	import {max, min, extent, range} from 'd3-array'
    import {schemeCategory10} from "d3-scale-chromatic";

    const allInds = Object.keys(ffRenData[0]).slice(1).sort((indA, indB) => indA.localeCompare(indB))
    const indicators = allInds.filter(ind => !ind.includes("percap"))
    const indicatorsPercap = allInds.filter(ind => ind.includes("percap"))

    const width = 600
    const height = 400
    const margin = {top: 20, right: 20, bottom: 20, left: 50};
    
    let togglePercap = false;
    $: indicatorsUsed = !togglePercap ? indicators : indicatorsPercap

    $: areaData = aq.from(ffRenData)
        .derive(indicatorsUsed.reduce((obj, ind) => {
          return {...obj, [ind]: aq.escape(d => {
            if(d[ind]){
              const [b, e] = d[ind].split("e")  
              return b * Math.pow(10, e)
            } else return 0
          })}
        }, {}))
        .derive({ 
          date: aq.escape(d => new Date(d.year, 0, 1)),
          total: aq.escape(d => indicatorsUsed.reduce((sum, ind) => {
            return sum + d[ind]
          }, 0))
        })
        // .relocate( "date", { before: "year" } )
        .select(aq.not((!togglePercap ? indicatorsPercap : indicators), "year"))
        .orderby("date")
        .objects()

    $: x = scaleUtc()
        .domain(extent(areaData, d => d.date))
        .range([margin.left, width - margin.right])

    $: y = scaleLinear()
        .domain([0, max(areaData, d => indicatorsUsed.reduce((sum, ind) => {
            return sum + d[ind]
        }, 0))]).nice()
        .range([height - margin.bottom, margin.top])

    $: seriesData = stack()
        .keys(indicatorsUsed)(areaData)
        .map(sData => sData.map((d, i) => {
            return {...d, data: areaData[i]}
        }))

    $: sDates = seriesData[0].map(d => d.data.date)
    $: sYears = sDates.map(date => date.getFullYear())

    $: areaPath = area()
        .x((d, i) => x(sDates[i]))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))

    $: yMax = max(areaData, d => indicatorsUsed.reduce((sum, ind) => {
      return sum + d[ind]
    }, 0))

    $: yValRange = range(0, 1.2*yMax, (1.2*yMax)/5)
        .map(y => Math.round(y.toFixed()/10000)*10000)

    $: xRev = scaleUtc()
        .domain([margin.left, width - margin.right])
        .range(extent(areaData, d => d.date))

    let ttVisibility = "hidden"
    const X_OFFSET = 500
    $: year = 1900
    $: sIndex = 0
    $: isCursorOnRight = false
    $: mouseX = 0
    $: mouseY = 0

    $: pointX = (sdpt) => sIndex > 0 ? x(sdpt[sIndex].data.date) : x(new Date(2000, 0, 1))
    $: pointY = (sdpt) => sIndex > 0 ? y(sdpt[sIndex][1]) : y(0)

    function handleMouseOver () {
        ttVisibility = "visible"
    }

    function handleMouseMove(e) {
        const {pageX, pageY} = e
        mouseX = pageX - X_OFFSET
        mouseY = pageY

        year = xRev(mouseX).getFullYear()
        sIndex = sYears.indexOf(year)
        isCursorOnRight = mouseX > x(width / 2)

        let isXWithinRange =  year > min(sYears) && year < max(sYears)
        ttVisibility = isXWithinRange ? "visible" : "hidden"
    }

    function handleMouseOut() {
        ttVisibility = "hidden"
    }

    $: getTooltipText = (sData, i) => {
        const ind = indicatorsUsed[i]
        const valFixed = sIndex >= 0 ? sData[sIndex].data[ind].toFixed(0) : 0
        const valRound = Math.round(valFixed / 100) * 100
        const perc = sIndex >= 0 ? ((valFixed / sData[sIndex].data.total) * 100).toPrecision(2) : 0
        const indNeat = ind.replace("percap", "").replace("prod", "")
        return `${indNeat}: ${valRound} (${perc}%)`
    }

    // To prevent throwing an error where mouseover and mouseout requires
    // accompanying onfocus and onblur
    function handleFocus() {}
    function handleBlur() {}

    // Encode legend labels
    const TWH = "Production (TWh)"
    const PC_KWH = "Production per capita (kWh)"
    $: energyUnit = !togglePercap ? TWH : PC_KWH
    $: encodeInd = (ind) => {
        switch(ind) {
            case indicatorsUsed[0]: return `Coal ${energyUnit}`;
            case indicatorsUsed[1]: return `Gas ${energyUnit}`;
            case indicatorsUsed[2]: return `Oil ${energyUnit}`;
            case indicatorsUsed[3]: return `Renewable ${energyUnit}`;
            default: return "";
        }
    }

</script>

<div class="area-chart">
    <div class="ui-controls">
        <input type="checkbox" id="toggle-gdp-per-cap" bind:checked={togglePercap}>
        <label for="toggle-gdp-per-cap">Show per capita values (kWh)</label>
    </div>
    <div class="legends">
        {#each indicatorsUsed as ind, i}
            <div class="legend-container">
                <div class="legend-color" style={`background-color: ${schemeCategory10[i]};`}></div>
                <span class="">{encodeInd(ind)}</span>
            </div>
        {/each}
    </div>
    <svg
        class="svg-area-chart"
        viewBox='0 0 {width} {height}'
        {width}
        {height}
        on:mouseover={handleMouseOver}
        on:mousemove={handleMouseMove}
        on:mouseout={handleMouseOut}
        on:focus={handleFocus}
        on:blur={handleBlur}
    >
        <g class="paths-group">
            {#each seriesData as sData, i}
                <path 
                    d={areaPath(sData)}
                    fill={schemeCategory10[i]}
                    class="path"
                />
            {/each}
        </g>
        <g class="axes">
            <g class="x-axis">
                <line
                    class="horizontal-rule"
                    x1={0}
                    x2={width}
                    y1={height - margin.top}
                    y2={height - margin.top}
                    stroke="#333333"
                    stroke-width="1"
                />
                {#each sDates.filter(dt => dt.getFullYear() % 20 === 0) as date}
                    <g class="x-tick">
                        <text
                            class="x-tick-label"
                            x={x(date)}
                            y={height}
                            text-anchor="middle"
                        >
                            {date.getFullYear()}    
                        </text>
                    </g>
                {/each}
            </g>
            <g class="y-axis">
                {#each yValRange as yVal}
                    <g class="y-tick">
                        <text
                            class="y-tick-label"
                            x={0}
                            y={y(yVal)}
                            dy="18"
                        >
                        {yVal}
                        </text>
                        <line
                            class="y-tick-line"
                            x1={0}
                            x2={width}
                            y1={y(yVal)}
                            y2={y(yVal)}
                            stroke="#cccccc"
                            stroke-width="0.5"
                        />
                    </g>
                {/each}
            </g>
        </g>
        <g class="tooltip">
            <g class="tt-values">
                <rect
                    x={isCursorOnRight ? mouseX - 185 : mouseX}
                    y="35"
                    width="180"
                    height="100"
                    fill="#fff"
                    stroke="#aaa"
                    stroke-width="0.5"
                    fill-opacity="0.75"
                    visibility={ttVisibility}
                />
                <text
                    class="tt-year"
                    x={isCursorOnRight ? mouseX - 10 : mouseX + 10}
                    y="25"
                    text-anchor={isCursorOnRight ? "end" : "start"}
                    visibility={ttVisibility}
                >
                    {year}
                </text>
                {#each seriesData as sData, i}
                    <text
                        class="tt-indicator"
                        x={isCursorOnRight ? mouseX - 10 : mouseX + 10}
                        y="40"
                        text-anchor={isCursorOnRight ? "end" : "start"}
                        dy={(i + 1) * 20}
                        visibility={ttVisibility}
                        fill={schemeCategory10[i]}
                    >
                        {getTooltipText(sData, i)}
                    </text>
                {/each}
            </g>
            <g class="vline">
                <line 
                    x1={mouseX - 2.5}
                    x2={mouseY - 2.5}
                    y1="0"
                    y2={yMax}
                    stroke="#000000"
                    opacity="0.5"
                    stroke-dasharray="2 3"
                    visibility={ttVisibility}
                />
            </g>
            <g class="points-group">
                {#each seriesData as sdpt}
                    <circle
                        r="5"
                        cx={pointX(sdpt)}
                        cy={pointY(sdpt)}
                        stroke="#000000"
                        fill="none"
                        visibility={ttVisibility}
                    />
                {/each}
            </g>
        </g>
    </svg>
</div>

<style>
.area-chart {
    display: block;
    height: 500px;
    width: 100%;
	margin: 0 0 2em 0;
    font-size: 14px;
}

.ui-controls {
    padding: 10px;
    border: 1px solid #ccc;
    margin: 5px 0;
    text-align: left;
}

.legends {
    display: flex;
    flex-flow: row;
    /* align-items: center; */
    padding: 5px;
    border: 1px solid #ccc;
    margin: 5px 0;
}

.legend-container {
    padding: 5px 10px;
    text-align: left;
}

.legend-color {
    height: 10px;
    width: 10px;
    display: inline-block;
    margin-right: 5px;
}
</style>