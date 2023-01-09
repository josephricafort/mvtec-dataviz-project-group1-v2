import fs from "fs";
import * as aq from "arquero";
import { compareFileSizes } from "./util.js";
import clm from "country-locale-map";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";
const { op, escape } = aq;
const { getAlpha2ByName } = clm;

/**
 * Steps involved in processing the data
 * 1. Import all needed datasets
 * 2. Combine datasets Fossil fuel,
 * 3. Process dataset for Fossil fuel + Renewable Area chart
 * 4. Process dataset for Trend lines
 */

// Import the datasets

const russCsv = "./Reliance on Russian imports.csv";
const ffCsv = "./Fossil fuel production BP & Shift (2022).csv";
const pennCsv = "./Penn World Table version 10.0.csv";
const ineqCsv = "./World Inequality Database (WID) - Pretax income.csv";
const renewCsv = "./owid-energy-data.csv";

const ffRaw = aq.fromCSV(fs.readFileSync(ffCsv, "utf8")).objects();
const pennRaw = aq.fromCSV(fs.readFileSync(pennCsv, "utf8")).objects();
const ineqRaw = aq.fromCSV(fs.readFileSync(ineqCsv, "utf8")).objects();
const owidEnergyRaw = aq.fromCSV(fs.readFileSync(renewCsv, "utf8")).objects();

// Cleaning the datasets before combining

const ffData = ffRaw.map(({ Entity, Year, ...indicators }) => {
  // Filter out non-Annuals indicators, just to reduce number of indicators in final output
  const notAnnualsArr = Object.entries(indicators)
    .map(([key, value]) => [key, +value])
    .filter(([key]) => !key.includes("Annual"));
  const notAnnualsObj = Object.fromEntries(notAnnualsArr);

  return {
    country: Entity,
    year: +Year,
    ...notAnnualsObj,
  };
});

const pennData = pennRaw.map(({ Entity, Year, ...indicators }) => {
  const selIndicatorsArr = Object.entries(indicators)
    .map(([key, value]) => [key, +value])
    .filter(([key]) => key.includes("GDP"));
  const selIndicatorsObj = Object.fromEntries(selIndicatorsArr);

  return {
    country: Entity,
    year: +Year,
    ...selIndicatorsObj,
  };
});

const ineqData = ineqRaw.map(({ Entity, Year, ...d }) => {
  return {
    country: Entity,
    year: +Year,
    "Gini coefficient": +d["Gini coefficient"],
    "Palma ratio (S90/S40 ratio)": +d["Palma ratio (S90/S40 ratio)"],
  };
});

function exp(n, f) {
  return Number.parseFloat(n).toExponential(f);
}

function toAlpha2Lower(str) {
  return String(getAlpha2ByName(str, true)).toLowerCase();
}

const renameCountryName = (ctry) => {
  switch (ctry) {
    case "Lao People's Democratic Republic":
      return "Laos";
      break;
    default:
      return ctry;
  }
};

const renewableData = () => {
  const renInds = Object.keys(owidEnergyRaw[0]).filter(
    (ind) => ind.includes("renewable") && !ind.includes("other")
  );
  const ctryAttrs = ["country", "year", "iso_code"];
  const allInds = [...ctryAttrs, ...renInds];

  return aq
    .from(owidEnergyRaw)
    .select(allInds)
    .filter(aq.escape((d) => Object.values(d).every((v) => v !== "")))
    .derive(
      renInds.reduce((obj, ind) => {
        return { ...obj, [ind]: aq.escape((d) => +d[ind]) };
      }, {})
    )
    .objects();
};

// Combine the fossil fuel datasets and economic indicators

const combinedTable = aq
  .from(ffData)
  .join_left(aq.from(ineqData))
  .join_left(aq.from(pennData))
  .derive({
    // Hard code some countries that didn't got the exact match
    country: aq.escape((d) => renameCountryName(d.country)),
  })
  .derive({
    // year: aq.escape(d => d.year.toString()),
    selData: aq.escape((d, i) => {
      const ctryData = clm.getCountryByName(d.country, true);
      if (ctryData) {
        const { alpha3, continent, region } = clm.getCountryByName(
          d.country,
          true
        );
        return [alpha3, continent, region];
      } else return;
    }),
  })
  .spread("selData")
  .rename({
    selData_1: "alpha3",
    selData_2: "continent",
    selData_3: "region",
  })
  .relocate(["alpha3", "continent", "region"], { after: "country" });

const combinedData = combinedTable.objects();

// Dataset for the fossil fuel + renewable indicators

const isNotCtryOrYear = ([key]) => key !== "country" && key !== "year";

const getIndicatorsList = (data) =>
  Object.entries(data[0])
    .filter(isNotCtryOrYear)
    .map(([key]) => key);

const ffIndicators = getIndicatorsList(ffData);
const ineqIndicators = getIndicatorsList(ineqData);
const pennIndicators = getIndicatorsList(pennData);

const RENEWABLES_ELECTRICITY = "Renewables Electricity (TWh)";
const RENEWABLES_PERCAP = "Renewables Energy Per Capita (kWh)";

const ffRenInds = [...ffIndicators.slice(0, 3), RENEWABLES_ELECTRICITY];
const ffRenPerCapInds = [...ffIndicators.slice(3, 6), RENEWABLES_PERCAP];
const ffTotalIndicators = ffIndicators.slice(0, 6);

const ffYearlyData = aq
  .from(ffData)
  .groupby("year")
  .rollup(
    ffTotalIndicators.reduce((obj, ind) => {
      return {
        ...obj,
        [ind]: ffTotalIndicators.slice(0, 3).includes(ind)
          ? op.sum(ind)
          : op.mean(ind),
      };
    }, {})
  )
  .objects();

const renewableYearlyData = aq
  .from(renewableData())
  .select("year", "renewables_electricity", "renewables_energy_per_capita")
  .rename({
    renewables_electricity: RENEWABLES_ELECTRICITY,
    renewables_energy_per_capita: RENEWABLES_PERCAP,
  })
  .groupby("year")
  .rollup({
    [RENEWABLES_ELECTRICITY]: op.sum(RENEWABLES_ELECTRICITY),
    [RENEWABLES_PERCAP]: op.mean(RENEWABLES_PERCAP),
  })
  .derive({ year: aq.escape((d) => +d.year) })
  .objects();

const shiftRenewableData = aq
  .from(ffYearlyData)
  .join_left(aq.from(renewableYearlyData))
  .fold([...ffTotalIndicators, RENEWABLES_ELECTRICITY, RENEWABLES_PERCAP])
  .rename({ key: "indicator" })
  .objects();

// Prepare Fossil Fuel + Renewable Data to be used for Svelte

const ffRenAllInds = [...ffRenInds, ...ffRenPerCapInds];
const ffRenAllIndsShort = [
  "coalprod",
  "gasprod",
  "oilprod",
  "renewable",
  "coalprodpercap",
  "gasprodpercap",
  "oilprodpercap",
  "renewablepercap",
];
const ffRenData = aq
  .from(shiftRenewableData)
  .groupby("year")
  .pivot("indicator", "value")
  .rename(
    ffRenAllInds.reduce((obj, ind, i) => {
      return { ...obj, [ind]: ffRenAllIndsShort[i] };
    }, {})
  )
  .derive(
    ffRenAllIndsShort.reduce((obj, ind) => {
      return { ...obj, [ind]: aq.escape((d) => exp(d[ind], 5)) };
    }, {})
  )
  .orderby("year")
  .objects();

// Export trendData.json in output folder
const ffRenDataOutput = JSON.stringify(ffRenData);
fs.writeFileSync("./output/ffRenData.json", ffRenDataOutput, "utf8");

// Prepare trends line data for export

const getCountries = (data) => [...new Set(data.map((d) => d.country))];
const ffCountries = getCountries(ffData);
const ineqCountries = getCountries(ineqData);
const pennCountries = getCountries(pennData);

const countriesMatched = ffCountries
  .filter((ctry) => ineqCountries.includes(ctry))
  .filter((ctry) => pennCountries.includes(ctry));

const TOTAL_ENERGY = "Total Energy (TWh)";
const MEAN_ENERGY_PERCAP = "Mean Energy Per Capita (kWh)";

const energyInds = [TOTAL_ENERGY, MEAN_ENERGY_PERCAP];
const countriesTrend = [
  ...new Set(
    combinedData
      .filter(
        (d) =>
          // !!d[ffSel] && !!d[outcomeSel] && // Moved this dependency to trend explorer chart
          countriesMatched.includes(d.country) && d.country !== "World"
      )
      .map((d) => d.country)
      .sort((ctryA, ctryB) => ctryA.localeCompare(ctryB))
  ),
];

const outcomeIndicators = ineqIndicators.concat(pennIndicators);
const allIndicators = ffIndicators.concat(outcomeIndicators);
const getMaxMinData = (ctries) =>
  ctries.map((ctry) => {
    const ctryData = combinedData.filter((d) => d.country === ctry);
    const { year, ...ctryD } = ctryData[0];
    return allIndicators.reduce(
      (sumObj, ind) => {
        const extentInd = extent(ctryData.map((d) => d[ind]));
        return { ...sumObj, [ind]: extentInd }; // sumInd}
      },
      { ...ctryD }
    );
  });
const maxMinTrendData = getMaxMinData(countriesTrend);

const normScale = (extent) => scaleLinear().domain(extent).range([0, 1]);
const getNormalizedData = (maxMinRefData, sourceData) => {
  const data = !!sourceData ? sourceData : combinedData;
  return data
    .map((d) =>
      allIndicators.reduce(
        (normObj, ind) => {
          const indObj = maxMinRefData.find((e) => e.country === d.country);
          if (indObj) {
            const extent = indObj[ind];
            return { ...normObj, [ind]: normScale(extent)(d[ind]) };
          } else return null;
        },
        { ...d }
      )
    )
    .filter((d) => d);
};
const normTrendData = getNormalizedData(maxMinTrendData);

const setYears = [...new Set(normTrendData.map((d) => d.year))].sort(
  (yr1, yr2) => yr1 - yr2
);
const trendContinentsData = aq
  .from(normTrendData)
  .filter((d) => !!d.continent)
  .groupby("year", "continent")
  .rollup(
    allIndicators.reduce((obj, ind) => {
      return { ...obj, [ind]: op.median(ind) };
    }, {})
  )
  .ungroup()
  .orderby("continent", "year")
  .objects();

const nYears = 10;
const getExtentYears = (ctry) =>
  extent(combinedData.filter((d) => d.country === ctry).map((d) => d.year));
const trendContiFiltData = trendContinentsData.filter(
  (d) =>
    d && (getExtentYears(d.country).includes(d.year) || d.year % nYears === 0)
);
// .filter((d) => !!d[ffSel] && !!d[outcomeSel]);

const trendWorldData = aq
  .from(trendContinentsData)
  .groupby("year")
  .rollup(
    allIndicators.reduce((rollupObj, ind) => {
      return { ...rollupObj, [ind]: op.mean(ind) };
    }, {})
  )
  .derive({ continent: (d) => "World" })
  .relocate(["continent"], { after: "year" })
  .objects()
  .filter((d) => d && d.year % nYears === 0);

const trendInds = [
  "year",
  "continent",
  ...ffIndicators,
  "Gini coefficient",
  "GDP (output, multiple price benchmarks)",
  "Share of household consumption in GDP",
  "Trade openness (share of exports and imports in GDP)",
];
const trendIndsShort = [
  "yr",
  "cont",
  "coalprod",
  "gasprod",
  "oilprod",
  "coalprodpc",
  "gasprodpc",
  "oilprodpc",
  "gini",
  "gdp",
  "sharehh",
  "tradeopen",
];
const trendData = aq
  .from(trendContiFiltData)
  .join_full(aq.from(trendWorldData))
  .select(trendInds)
  .rename(
    trendInds.reduce((obj, ind, i) => {
      return { ...obj, [ind]: trendIndsShort[i] };
    }, {})
  )
  .derive(
    trendIndsShort.slice(2).reduce((obj, ind) => {
      return { ...obj, [ind]: aq.escape((d) => exp(d[ind], 2)) };
    }, {})
  )
  .objects();

console.log(trendData);

// Export trendData.json in output folder
const trendDataOutput = JSON.stringify(trendData);
fs.writeFileSync("./output/trendData.json", trendDataOutput, "utf8");

/**
 * This is a helper function to log out and compare the file sizes of the
 * original and optimized datasets. If it slows your computer down too much when
 * you save, you can comment it out until you want to compare the file sizes.
 */
// compareFileSizes(csvData, outputData);
