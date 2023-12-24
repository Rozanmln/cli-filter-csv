#!/usr/bin/env node

const yargs = require("yargs");
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const options = yargs
  .usage("Usage: -d <csv directory> -s <start time> -e <end time>")
  .option("d", {
    alias: "dir",
    describe: "CSV Directory",
    type: "string",
    demandOption: true,
  })
  .option("s", {
    alias: "start",
    describe: "Filter start time",
    type: "string",
    demandOption: true,
  })
  .option("e", {
    alias: "end",
    describe: "Filter end time",
    type: "string",
    demandOption: true,
  }).argv;

async function addHeaderToCSV(filePath, newRow) {
  try {
    const existingContent = await fs.promises.readFile(filePath, "utf8");

    const contentLines = existingContent.split("\n");
    const firstRow = contentLines.length > 0 ? contentLines[0] : "";
    let firstRowArray = firstRow.split(",");
    firstRowArray[firstRowArray.length - 1] = firstRowArray[
      firstRowArray.length - 1
    ].replace(/\r$/, "");

    // check apabila header sudah pernah ditambahkan
    if (firstRowArray.join(",") == newRow.join(",")) {
      return;
    }

    const newContent = `${newRow.join(",")}\n${existingContent}`;

    await fs.promises.writeFile(filePath, newContent);

    console.log(`Header telah ditambahkan ke ${filePath}`);
  } catch (err) {
    console.error(`Error menambahkan header to ${filePath}: ${err.message}`);
  }
}

// const dirPath = "../../csv";
// const startDate = "2023-06-06T06:52:54.000Z";
// const endDate = "2023-07-06T06:52:54.000Z";
const dirPath = options.dir;
const startDate = options.start;
const endDate = options.end;
const csvDatas = [];
const csvHeaders = ["TrxNo", "TrxDate", "TrxDetail", "Amount"];

fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error("Error membaca directory", err);
    return;
  }

  let fileReaded = 0;

  files.forEach((file) => {
    const filePath = `${dirPath}/${file}`;

    if (file.endsWith(".csv")) {
      addHeaderToCSV(filePath, csvHeaders).then(() => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            // console.log(data);
            // console.log(data.TrxDate)
            data.TrxDate = new Date(data.TrxDate);
            // console.log(data.TrxDate)
            data.TrxNo = parseInt(data.TrxNo, 10);
            data.Amount = parseInt(data.Amount, 10);
            csvDatas.push(data);
          })
          .on("end", () => {
            fileReaded++;
            // console.log(`data ${file} berhasil dibaca`);

            if (fileReaded === files.length) {
              try {
                // ----- boleh pake .filter atau harus for loop manual?
                // const filteredDatas = csvDatas
                //   .filter(
                //     (data) =>
                //       // ----- < atau <= ?
                //       data.TrxDate >= new Date(startDate) &&
                //       data.TrxDate <= new Date(endDate)
                //   )
                //   .sort((a, b) => a.TrxDate - b.TrxDate);

                const filteredDatas = [];
                for (let i = 0; i < csvDatas.length; i++) {
                  if (
                    csvDatas[i].TrxDate >= new Date(startDate) &&
                    csvDatas[i].TrxDate <= new Date(endDate)
                  ) {
                    filteredDatas.push(csvDatas[i]);
                  }
                }

                // console.log("filtered csv datas:", filteredDatas);

                // ----- output datenya RFC-3339 yang global atau yang local indo
                filteredDatas.forEach((singelData) => {
                  singelData.TrxDate = singelData.TrxDate.toISOString();
                });

                const outputCSV = createCsvWriter({
                  path: "./output.csv",
                  header: [
                    { id: "TrxNo", title: "TrxNo" },
                    { id: "TrxDate", title: "TrxDate" },
                    { id: "TrxDetail", title: "TrxDetail" },
                    { id: "Amount", title: "Amount" },
                  ],
                });
                outputCSV.writeRecords(filteredDatas);
                console.log("successfully filter the data");
              } catch (error) {
                console.log("unable to filter the data:", error);
              }
            }
          })
          .on("error", (err) => {
            console.log(`data ${file} error dibaca`, err);
          });
      });
    }
  });
});
