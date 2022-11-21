drop database if exists CrimeCovid;
create database if not exists CrimeCovid;
use CrimeCovid;

drop table if exists `CrimeCode`;
create table if not exists `CrimeCode`(
	`Code` varchar(4),
	`CrimeName` varchar(25),
	primary key (`Code`)
);

drop table if exists `Weapon`;
create table if not exists `Weapon`(
	`WeaponID` tinyint,
	`WeaponName` varchar(30),
	primary key (`WeaponID`)
);

drop table if exists `CovidCase`;
create table if not exists `CovidCase`(
	`DayNum` smallint,
	`Date` datetime,
	`TotalCases` mediumint,
	`DailyIncrease` smallint,
	`AvgIncrease` smallint,
	primary key (`DayNum`)
);

drop table if exists `Crime`;
create table if not exists `Crime`(
	`RowID` mediumint,
	`DayNum` smallint,
	`CrimeDate` datetime,
	`CrimeCode` varchar(4),
	`WeaponID` tinyint,
	`Gender` char,
	`Age` tinyint,
	`District` varchar(2),
	`Latitude` float,
	`Longitude` float,
	primary key (`RowID`)
);
