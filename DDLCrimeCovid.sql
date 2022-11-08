drop table if exists `CrimeCode`;
create table if not exists `CrimeCode`(
	`Code` varchar(3),
	`CrimeName` varchar(20),
	primary key (`Code`)
);

drop table if exists `CovidCase`;
create table if not exists `CovidCase`(
	`DayNum` smallint,
	`Date` date,
	`TotalCases` mediumint,
	`DailyIncrease` smallint,
	`AvgIncrease` smallint,
	primary key (`DayNum`)
);

drop table if exists `Crime`;
create table if not exists `Crime`(
	`RowID` mediumint,
	`DayNum` smallint,
	`CrimeDateTime` datetime,
	`CrimeCode` varchar(3),
	`Weapon` varchar(20),
	`Gender` char,
	`Age` tinyint,
	`District` varchar(2),
	`Latitude` float,
	`Longitude` float,
	primary key (`RowID`)
);




