import './App.css';
import React,{useRef, useEffect, useState,setState} from 'react';
import Axios from 'axios';
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineSeries, VerticalBarSeries,FlexibleXYPlot,Hint} from "react-vis";
import { MapContainer, TileLayer, Map, Marker, Popup, ZoomControl} from 'react-leaflet'
import '../node_modules/leaflet/dist/leaflet.css'
import {HeatmapLayer} from "react-leaflet-heatmap-layer-v3/lib";


function App(){
  
  //stores currently graphed covid weekly avg increase (the line graph)
  const [coviddata, setcoviddata] = useState([]);
  //stores start and end date respectively for covid line graph
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');


  //stores currently graphed criminal age (the age bar graph)
  const [crimeagebar, setcrimeagebar] = useState([]);
  //stores start and end date respectively for crime bargraph age (bga) and district
  const [endDatebga, setEndDatebga] = useState('');
  const [startDatebga, setStartDatebga] = useState('');
  const [districtbga, setdistrictbga] = useState('');

  //stores start and end date for heatmap
  const [startDateheat, setStartDateheat] = useState('');
  const [endDateheat, setEndDateheat] = useState('');

  //values used to store Hint data covid line graph (for prompt when mousing over graphs)
  const [currval, setCurrval] = useState({});
  //Used for covid line graph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const [covidlhintstyle,setcovidlhintstyle] = useState('');
  const hinthandlecovidl = (val,cssClassname)=>{
    setCurrval(val)
    setcovidlhintstyle(cssClassname)
  }

  //values used to store Hint data crimeage graph (for prompt when mousing over graphs)
  const [currbarval, setCurrbarval] = useState({});
  //Used for age crime bargraph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const [crimeagehintstyle,setcrimeagehintstyle] = useState('');
  const hinthandlecrimeage = (val,cssClassname)=>{
    setCurrbarval(val)
    setcrimeagehintstyle(cssClassname)
  }



  //default variables used for running graphs on website start up
  const defaultStart = "2020-03-15"
  const defaultEnd = "2020-04-15"
  const defaultdist = "Al" //Al for ALL disctricts
  const Baltimore_position = [39.2904,-76.6122]

  

  
  //sends start and end date to backend, gets list of dictionaries back for line graph
  const startEndDate = () => {

    //if no value for one or both start/end dates have not been entered, do not do anything
    if(startDate === "" || endDate === ""){
      console.log("User has not entered either a start date or end date (Covid line graph)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://localhost:5000/covidlinegraph', {params:{
      startdate: startDate, 
      enddate: endDate}
    }).then((response) => {
      //Overrides stored data in coviddata variable
      console.log(response.data)
      setcoviddata(response.data)
      })
    }
  }

  //sends start/end date and district to backend, gets list of dictionaries back for crime age bar graph. Overrides crimeagebar to update bar graph
  const startEndDatebga = () => {

    //if no value for one or both start/end dates or district have not been entered, do not do anything
    if(startDatebga === "" || endDatebga === "" || districtbga === ""){
      console.log("User has not entered either a start date, end date, or district (crime age bar graph)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://localhost:5000/crimeagebargraph', {params:{
      startdatebga: startDatebga, 
      enddatebga: endDatebga,
      districtbga: districtbga}
    } ).then((response) => {
      //Overrides stored data in crimeagebar variable
      console.log(response.data)
      setcrimeagebar(response.data)
      })
    }
  }

  //Gets default coviddata from backend as a list of dictionaries to be graphed
  useEffect(() => {
    Axios.get("http://localhost:5000/covidlinegraph",{params:{
      startdate: defaultStart, 
      enddate: defaultEnd}
      }).then((response) => {
        setcoviddata(response.data)
        console.log(response.status)
      })
  },[]);
  
  //Gets default parametered crime data from backend as a list of dictionaries to be age bar graph (first 100 days, all districts) displays on page start
  useEffect(() => {
    Axios.get("http://localhost:5000/crimeagebargraph",{params:{
      startdatebga: defaultStart, 
      enddatebga: defaultEnd,
      districtbga: defaultdist}
      }).then((response) => {
        setcrimeagebar(response.data)
        console.log(response.status)
      }
      ).catch(function (error) {
      console.log("Error displaying default Crime Age Bar Graph. Page was refreshed before the queries in the backend could be completed.");
      });
  },[]);


  //testing leaflet / leaflet-react
  const [heatmap, setheatmap] = useState([]);

  useEffect(() => {
    Axios.get("http://localhost:5000/heatmapmarkers", {params:{
      startdateheat: defaultStart, 
      enddateheat: defaultEnd}}
      ).then((response) => {
        setheatmap(response.data)
        console.log(response.status)
      }
    )
  },[]);

  const startEndDateheat = () =>{

    //if no value for one or both start/end dates have not been entered, do not do anything
    if(startDateheat === "" || endDateheat === ""){
      console.log("User has not entered either a start date or end date (HeatMap)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://localhost:5000/heatmapmarkers', {params:{
      startdateheat: startDateheat, 
      enddateheat: endDateheat}
      }).then((response) => {
      //Overrides stored data in coviddata variable
      console.log(response.data)
      setheatmap(response.data)
      })
    }

  }


  return (
    
    <div className="App">
      <header className="App-header">

      <h1>Team5 - 447 Spring 2022</h1>
      <p className="name_size">By: Christopher Carnahan, Kevin Mensah, Josef Obitz, Jil Patel, Dillon Ward</p> 
      </header>
      

      {/*Heatmap form*/}
      <form className='dateform'>

        {/*Gets user input from calendar, stores in startDateheat variable*/}
        <label>Start Date:</label>
        <input required type="date" id="start" name="date-start" 
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setStartDateheat(e.target.value)
        }}></input>
        
        {/*Gets user input from calendar, stores in endDateheat variable*/}
        <label>End Date:</label>
        <input required type="date" id="end" name="date-end"
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setEndDateheat(e.target.value)
        }}></input>

        {/*Form submit button (KEEP AS TYPE button! breaks otherwise)*/ }
        <input type="button" onClick={startEndDateheat} value="Submit"></input>
      </form>

      
  
      {/* Title heatmap*/}
      <h3 id="lgraphtitle">Baltimore City Violent Crime </h3>

      {/*Leaflet-react Map with heatmap layer */}
      <div className="heatmap">
        {/*Create Map*/}
        <MapContainer center={Baltimore_position} zoom={12} scrollWheelZoom={true} zoomControl={false}> 

          {/*Heatmap controls
            points takes in a 2-D list; each row contains [latitude,longitude,marker-intensity]*/}
          <HeatmapLayer
              minOpacity={.00001}
              points={heatmap}
              longitudeExtractor={m => m[1]}
              latitudeExtractor={m => m[0]}
              intensityExtractor={m => parseFloat(m[2])} />          


          {/*Map being pulled from the internet and used */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

          <ZoomControl position='topright'/>
        </MapContainer>
      </div>  


      {/*Covid line graph#################################################################################################### */}
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

        <FlexibleXYPlot height={400} xType="ordinal"  margin={{bottom: 100, left: 50, right: 10, top: 10}} onMouseLeave={(value)=>setcovidlhintstyle("hidehint")}>
          <HorizontalGridLines />
          <VerticalGridLines />
          <XAxis  title="Date" 
            tickLabelAngle={-90}
            tickFormat={function tickFormat(currdate){return new Date(currdate).toLocaleDateString()}}
            attr="x" attrAxis="y" 
            orientation="bottom"/>

          <YAxis headLine title="1-Week Average Increase" />


          {/*Setting the data dictionary to be displayed({"x": date, "y": avgincrease}). Also setting currval to nearest point to cursor and sets css class to display*/}  
          <LineSeries data={coviddata} 
            onNearestX={(value) =>  hinthandlecovidl(value,"hintprompt")}
            />


          {/*Outputs data from currval*/}
          <Hint value={currval} marginLeft={0} marginTop={0}>
            <div className={covidlhintstyle}>
              <h3 className='hinttitle'>Date:</h3>
              <p>{String(currval.x).slice(0,10)}</p>
              <h3 className='hinttitle'>1-Week AVG Increase:</h3>
              <p>{currval.y}</p>
            </div>
          </Hint>

        </FlexibleXYPlot>
     
      </div>
      
      


      {/*Crime age bar graph#################################################################################################### */}
      <form className='dateform'>
        
        {/*Gets user input from calendar, stores in startDatebga variable*/}
        <label>Start Date:</label>
        <input required type="date" id="agestart" name="date-start" 
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setStartDatebga(e.target.value)
        }}></input>
        
        {/*Gets user input from calendar, stores in endDatebga variable*/}
        <label>End Date:</label>
        <input required type="date" id="ageend" name="date-end"
        min="2020-03-15" max="2021-09-30"
        onChange={(e) =>{
          setEndDatebga(e.target.value)
        }}></input>

         {/*Gets user input from list for district, stores in districtbga variable*/}
         <label>District:</label>
        <select required type="" id="agedisctrict" name="district"
        onChange={(e) =>{
            setdistrictbga(e.target.value)
        }}>
          <option value="" disabled selected>Select District</option>
          <option value="Al">All</option>
          <option value="N">Northern</option>
          <option value="S">Southern</option>
          <option value="E">Eastern</option>
          <option value="W">Western</option>
          <option value="NE">NorthEastern</option>
          <option value="NW">NorthWestern</option>
          <option value="SE">SouthEaster</option>
          <option value="SW">SouthWestern</option>
          <option value="C">Central</option>
        </select>

        {/*Form submit button (KEEP AS TYPE button! breaks otherwise)*/ }
        <input type="button" onClick={startEndDatebga} value="Submit"></input>
      </form>
      
      {/*Crime bar graph display*/}
      <div className='covidagebar'>

        <h3 id="lgraphtitle">Criminal Ages </h3>
        <link rel="stylesheet" href="https://unpkg.com/react-vis/dist/style.css"></link>

        <XYPlot xType="ordinal" width={1000} height={300} onMouseLeave={(value)=>setcrimeagehintstyle("hidehint")}>
          <HorizontalGridLines/>
          <VerticalGridLines/>
          <XAxis  title="Ages"/>

          <YAxis headLine title="Count"/>

          {/*Setting the data dictionary to be displayed. X is category, Y is #of occurences ({"x": age-category, "y": #of occurences})
          Cursor will change displayed hint value and set correct css style to not be hidden*/}  
          <VerticalBarSeries data={crimeagebar}
            onNearestX={(value) => hinthandlecrimeage(value,"hintprompt")}/>

          {/*Outputs data from currval*/}
          <Hint value={currbarval} marginLeft={0} marginTop={0}>
            <div className={crimeagehintstyle}>
              <h3 className='hinttitle'>Count:</h3>
              <p>{currbarval.y}</p>
            </div>
          </Hint>
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
