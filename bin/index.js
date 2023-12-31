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

const dirPath = options.dir;
const startDate = options.start;
const endDate = options.end;

fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error("Error membaca directory", err);
    return;
  }

  const csvDatas = [];
  const csvHeaders = ["TrxNo", "TrxDate", "TrxDetail", "Amount"];
  let fileReaded = 0;

  if (new Date(startDate) > new Date(endDate)) {
    console.log("tanggal start harus lebih kecil daripada tanggal selesai");
    return;
  }

  files.forEach((file) => {
    const filePath = `${dirPath}/${file}`;

    if (file.endsWith(".csv")) {
      addHeaderToCSV(filePath, csvHeaders).then(() => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            data.TrxDate = new Date(data.TrxDate);
            data.TrxNo = parseInt(data.TrxNo, 10);
            data.Amount = parseInt(data.Amount, 10);
            csvDatas.push(data);
          })
          .on("end", () => {
            fileReaded++;

            if (fileReaded === files.length) {
              try {
                const filteredDatas = [];
                for (let i = 0; i < csvDatas.length; i++) {
                  if (
                    csvDatas[i].TrxDate >= new Date(startDate) &&
                    csvDatas[i].TrxDate <= new Date(endDate)
                  ) {
                    filteredDatas.push(csvDatas[i]);
                  }
                }

                filteredDatas.forEach((singelData) => {
                  const dateBeforeFormat = new Date(
                    singelData.TrxDate.toISOString()
                  );
                  const formatedDate = new Date(
                    dateBeforeFormat.getTime() -
                      dateBeforeFormat.getTimezoneOffset() * 60 * 1000
                  );
                  const formatedDateString = formatedDate
                    .toISOString()
                    .replace(".000Z", "+07:00");

                  singelData.TrxDate = formatedDateString;
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
