import './App.css';
import React,{useRef, useEffect, useState} from 'react';
import Axios from 'axios';
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineSeries} from "react-vis";


function App(){
  
  //stores currently graphed covid weekly avg increase (the line graph)
  const [coviddata, setcoviddata] = useState([]);

  //stores start and end date respectively for covid line graph
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');



  //sends start and end date to backend, gets list of dictionaries back for line graph
  const startEndDate = () => {
    Axios.get('http://localhost:5000/covidlinegraph', {params:{
      startdate: startDate, 
      enddate: endDate}
    } ).then((response) => {
      //Overrides stored data in coviddata variable
      console.log(response.data)
      setcoviddata(response.data)
  })
  }

  //Gets all coviddata from backend as a list of dictionaries to be graphes
  useEffect(() => {
    fetch("http://localhost:5000/").then(
      res => res.json()
    ).then(
      data => {
        setcoviddata(data)
        console.log(data)
      }
    )
  },[]);


  return (
    <div className="App">
      <header className="App-header">

      <h1>Team5 - 447 Spring 2022</h1>
      <p className="name_size">By: Christopher Carnahan, Kevin Mensah, Josef Obitz, Jil Patel, Dillon Ward</p> 
      </header>
      



      <form className='dateform'>
        
        {/*Gets user input from calendar, stores in startDate variable*/}
        <label>Start Date:</label>
        <input required type="date" id="start" name="date-start" 
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setStartDate(e.target.value)
        }}></input>
        
        {/*Gets user input from calendar, stores in endDate variable*/}
        <label>End Date:</label>
        <input required type="date" id="end" name="date-end"
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setEndDate(e.target.value)
        }}></input>

        {/*Form submit button (KEEP AS TYPE button! breaks otherwise)*/ }
        <input type="button" onClick={startEndDate} value="Submit"></input>
      </form>


      
      {/*Covid linegraph 1week average display*/}
      <div className='covidlgraph'>

        <h3 id="lgraphtitle">Weekly Average Increase in COVID-19 cases </h3>
        <link rel="stylesheet" href="https://unpkg.com/react-vis/dist/style.css"></link>

        <XYPlot xType="ordinal" width={1000} height={300}>
          <HorizontalGridLines />
          <VerticalGridLines />
          <XAxis  title="Date" 
            tickFormat={function tickFormat(d){return new Date(d).toLocaleDateString()}} 
            attr="x" attrAxis="y" 
            orientation="bottom"/>

          <YAxis headLine title="1-Week Average Increase" />

          {/*Setting the data dictionary to be displayed*/}  
          <LineSeries data={coviddata} />

        </XYPlot>
      </div>
      

    {/* test output for covid cases for reference when returning query dump
    <div>
      {coviddata.map(cases => {
          return(
          <div key = {cases.DayNum}>

            <table>
              <tbody>
                <tr>
                  <th>DayNum</th>
                  <th>DATE</th>
                  <th>TotalCases</th>
                  <th>DailyIncrease</th>
                  <th>AVGIncrease</th>
                </tr>

                <tr>
                  <td>{cases.DayNum}</td>
                  <td>{cases.DATE}</td>
                  <td>{cases.TotalCases}</td>
                  <td>{cases.DailyIncrease}</td>
                  <td>{cases.AVGIncrease}</td>


                </tr>
              </tbody>
            </table>

          </div>
          )
        })
      }
    </div>
    */}

    </div>
  );
}

export default App;
