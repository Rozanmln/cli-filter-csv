# Filter CSV CLI
This application is a CLI made with nodejs to filter several csv files in a certain directory. the column that is filtered is TrxDate which is filtered based on the start time and end time inputted by user

# How to Use
First of all, after cloning this repository, run this code with cmd in directory where package.json located
> npm install
> 
> npm install -g

After that, you can check the program by type code below and see the instruction appear
> filter

```
Usage: -d <csv directory> -s <start time> -e <end time>

Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -d, --dir      CSV Directory                               [string] [required]
  -s, --start    Filter start time                           [string] [required]
  -e, --end      Filter end time                             [string] [required]

Missing required arguments: d, s, e
```

Based on that information, you must input 3 arguments and 3 values with this format
```
filter <argument1> <value1> <argument2> <value2> <argument3> <value3>
```

Example : 
```
filter -d D:\buat_bullion\test_coding\csv -s 2023-06-27T03:21:04+07:00 -e 2023-11-17T19:24:00+07:00
```

And Finally, you can see that the output CSV file is generated in directory where you have run the cli
