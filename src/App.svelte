<script>
  import { onMount } from "svelte";
 // import RussData from "./data/Reliance on Russian imports.csv";
  //import Russ_Imports_Multiline from "./BarChart.svelte";
  import Line from "./components/charts/Line.svelte";
  import FfRenChart from "./components/FFRenChart.svelte";
  import TrendLinesChart from "./components/TrendLinesChart.svelte";
  import RussianImportsChart from "./components/RussianImportsChart.svelte";

  let importFilter = "Natural Gas";

	function changeImportFilter(choice) {
        if (choice == "Natural Gas") {
            importFilter = "Natural Gas";
        } else if (choice == "Coal"){
            importFilter = "Coal";
        } else if (choice == "Oil"){
            importFilter = "Oil";
        }
    }
</script>

<!-- svelte-ignore missing-declaration -->
<main>
	<section class="header">
		<h1> Fossil Fuel Production</h1>
		<p>
		During the last 120 years, countries started to produce more and more fossilfuels (gas, oil and coal). But, we can also see them changing the amount of production. Why is that? We explore the data about fossil fuel production in order to find out what impacts a country to produce more or less fossil fuels. We have three hypothesises: There might be political reasons (independence from other countries), social reasons or economic benefits. We leave the topic of sustainablity out as there is another team looking deeply at that.
		<br><br>
		Let's start with the most recent topic: Fossil fuel production dominates public discourse in many countries at the moment, especially in Europe. The reason for that is the Russian invasion in Ukraine. The war has caused many countries to no longer want to rely on supplies from Russia. On the one hand, Russia does not seem to be a reliable economic partner anymore. On the other hand, politicians do not want to trade with Russia anymore for moral reasons.
		As there are no up-to-date information about fossil fuel imports from Russia since the start of the invasion in February 2021, we have a look at the data from 1990 to 2021 - we would expect a decrease of Russian imports already after 2014 because in that year, Russia invaded the Ukrainian Crimea.
		</p>
	</section>
	<section class="content russian-imports">
		<h3>Russian agression does not impact {importFilter} imports</h3>
		<button on:click={() => changeImportFilter("Natural Gas")}>Gas</button>
		<button on:click={() => changeImportFilter("Coal")}>Coal</button>
		<button on:click={() => changeImportFilter("Oil")}>Oil</button>
		<br>
		<RussianImportsChart filter = {importFilter}/>
		<br>
		The chart shows which percentage of the countrie's consumption of each fossil fuel is imported from Russia. We don't see a clear pattern. But, a closer look at the chart reveals that countries which are close to Russia (e.g. Estonia and Lithuania) particularly depend on Russian imports. At first sight it might seem irritating that some countries import more than 100 percent of their consumption from Russia. That is because some import more than they consume, for example because they save it.<br>
		We don't see a sharp decrease of fossil fuel imports from Russia after 2014 or in the following years. From that we conclude that political independence was not an important motivation to stop importing and to start producing more. However, this might change at the moment.
	</section>
	<section class="content fossil-fuel-renewable">
		<h3>Renewable energy production remains insignificant compared to total fossil fuel production</h3>
		<FfRenChart />
	</section>
	<section class="content fossil-fuel-trend">
		<h3>Reducing fossil fuel may not necessarily mean a decline in GDP</h3>
		<TrendLinesChart />
	</section>
</main>

<style>
main {
	margin:0;
	padding:0;
}

h1 {
	color: black;
	font-weight: 400;
	margin: 0;
	padding:0;
}

main {
	background: #ffffff;
	color: black;
	border-radius: 1em;
	/* padding: 1em;
	position: absolute;
	width: 40%;
	top: 50%;
	left: 50%;
	margin-right: -50%;
	align-items: center;
	justify-content: center;
	transform: translate(-50%, -50%); */
	max-width: 700px;
	width: 100%;
	margin: 0 auto;
}

section {
	padding: 30px;
}

:global(.chart) {
	width: 100%;
	min-width: 600px;
	max-width: 1200px;
}

</style>