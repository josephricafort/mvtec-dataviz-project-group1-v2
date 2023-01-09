import fs from "fs";
import csvToJson from 'csvtojson';
import * as aq from "arquero";
import { stringify } from "querystring";
const { op } = aq;

const pathToCsv = "./Reliance on Russian imports.csv"
const csvData= fs.readFileSync(pathToCsv, "utf8")
const table = aq.fromCSV(csvData)

const cleaned = table.fold(table.columnNames().slice(2))
                .rename({COUNTRY: "Country",
                        PRODUCT: "Fossil_Fuel",
                        key: "Year",
                        value: "Percentage"})

const csvOutput = cleaned.toCSV()

fs.writeFileSync("clean_RussianImports.csv", csvOutput, "utf8")


const json = await csvToJson().fromFile("clean_RussianImports.csv");

let outputData = json.map(item=>{
        return {
                      "Country": item.Country,
                      "Fossil_Fuel": item["Fossil_Fuel"],
                      "Year": parseInt(item.Year),
                      "Percentage": parseInt(item.Percentage)
                  }
      });



const jsonString = JSON.stringify(outputData, null, 2)

fs.writeFileSync("clean_RussianImports.json", jsonString, "utf8")
