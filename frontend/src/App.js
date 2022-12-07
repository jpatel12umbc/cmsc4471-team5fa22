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
  const [weaponbga, setweaponbga] = useState('');

  //stores start/end date and selected district for heatmap
  const [startDateheat, setStartDateheat] = useState('');
  const [endDateheat, setEndDateheat] = useState('');
  const [districtheat, setdistrictheat] = useState('');
  const [weaponheat, setweaponheat] = useState('');

  
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
  const defaultweapon = "Al" //Al for ALL weapons
  const Baltimore_position = [39.2904,-76.6122]

  

  
  //sends start and end date to backend, gets list of dictionaries back for line graph
  const startEndDate = () => {
    //checking if valid end and start date
    if(endDate < startDate){
      console.log("User entered invalid start and end dates")
      alert("End date needs to be greater than Start Date")
    }
    //if no value for one or both start/end dates have not been entered, do not do anything
    else if(startDate === "" || endDate === ""){
      console.log("User has not entered either a start date or end date (Covid line graph)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://127.0.0.1:5000/covidlinegraph', {params:{
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
    //checking if valid end and start date
    if(endDatebga < startDatebga){
      console.log("User entered invalid start and end dates")
      alert("End date needs to be greater than Start Date")
    }
    //if no value for one or both start/end dates or district or weapon have not been entered, do not do anything
    else if(startDatebga === "" || endDatebga === "" || districtbga === "" || weaponbga === ""){
      console.log("User has not entered either a start date, end date, or district (crime age bar graph)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://127.0.0.1:5000/crimeagebargraph', {params:{
      startdatebga: startDatebga, 
      enddatebga: endDatebga,
      districtbga: districtbga,
      weaponbga: weaponbga}
    } ).then((response) => {
      //Overrides stored data in crimeagebar variable
      console.log(response.data)
      setcrimeagebar(response.data)
      })
    }
  }

  //Gets default coviddata from backend as a list of dictionaries to be graphed
  useEffect(() => {
    Axios.get("http://127.0.0.1:5000/covidlinegraph",{params:{
      startdate: defaultStart, 
      enddate: defaultEnd}
      }).then((response) => {
        setcoviddata(response.data)
        console.log(response.status)
      })
  },[]);
  
  //Gets default parametered crime data from backend as a list of dictionaries to be age bar graph (first 100 days, all districts) displays on page start
  useEffect(() => {
    Axios.get("http://127.0.0.1:5000/crimeagebargraph",{params:{
      startdatebga: defaultStart, 
      enddatebga: defaultEnd,
      districtbga: defaultdist,
      weaponbga: defaultweapon}
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

  //Sets default heatmap for default dates and all districts to be displayed
  useEffect(() => {
    Axios.get("http://127.0.0.1:5000/heatmapmarkers", {params:{
      startdateheat: defaultStart, 
      enddateheat: defaultEnd,
      districtheat: defaultdist,
      weaponheat: defaultweapon}
    }).then((response) => {
        setheatmap(response.data)
        console.log(response.status)
      }
    )
  },[]);

  //Updates heatmap variable with new parameters, will change currently displayed heatmap.
  const startEndDateheat = () =>{
    //checking if valid end and start date
    if(endDateheat < startDateheat){
      console.log("User entered invalid start and end dates")
      alert("End date needs to be greater than Start Date")
    }
    //if no value for one or both start/end dates have not been entered, do not do anything
    else if(startDateheat === "" || endDateheat === "" || districtheat === "" || weaponheat === ""){
      console.log("User has not entered either a start date or end date (HeatMap)")
      alert("Please fill out every field")
    }
    else{
    Axios.get('http://127.0.0.1:5000/heatmapmarkers', {params:{
      startdateheat: startDateheat, 
      enddateheat: endDateheat,
      districtheat: districtheat,
      weaponheat: weaponheat}
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

        {/*Gets user input from list for district, stores in districtheat variable*/}
        <label>District:</label>
        <select required type="" id="agedisctrictheat" name="district"
        onChange={(e) =>{
            setdistrictheat(e.target.value)
        }}>
          <option value=""  defaultValue={""} >Select District</option>
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

        {/*Gets user input from list for weapon, stores in weaponheat variable*/}
        <label>Weapon:</label>
        <select required type="" id="ageweapon" name="weapon"
        onChange={(e) =>{
            setweaponheat(e.target.value)
        }}>
          <option value=""  defaultValue={""} >Select Weapon</option>
          <option value="Al">All</option>
          <option value="1">None</option>
          <option value="2">Other</option>
          <option value="3">Firearm</option>
          <option value="4">Knife</option>
          <option value="5">Hands</option>
          <option value="6">Personal Weapon</option>
          <option value="7">Fire</option>
          <option value="8">Cutting instrument</option>
          <option value="9">Blunt Object</option>
          <option value="10">Motor Vehicle</option>
          <option value="11">Drugs,Narcotics,Sleeping pills</option>
          <option value="12">Unknown</option>
          <option value="13">Other (Firearm)</option>
          <option value="14">Handgun</option>
          <option value="15">Automatic Handgun</option>
          <option value="16">Asphyxiation</option>
          <option value="17">Rifle</option>
          <option value="18">Shotgun</option>

        </select>

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
      <form className='dateformcov'>
      
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
      <form className='dateformcrime'>
        
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
          <option value=""  defaultValue={""} >Select District</option>
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

        {/*Gets user input from list for weapon, stores in weaponbga variable*/}
        <label>Weapon:</label>
        <select required type="" id="ageweapon" name="weapon"
        onChange={(e) =>{
            setweaponbga(e.target.value)
        }}>
          <option value=""  defaultValue={""} >Select Weapon</option>
          <option value="Al">All</option>
          <option value="1">None</option>
          <option value="2">Other</option>
          <option value="3">Firearm</option>
          <option value="4">Knife</option>
          <option value="5">Hands</option>
          <option value="6">Personal Weapon</option>
          <option value="7">Fire</option>
          <option value="8">Cutting instrument</option>
          <option value="9">Blunt Object</option>
          <option value="10">Motor Vehicle</option>
          <option value="11">Drugs,Narcotics,Sleeping pills</option>
          <option value="12">Unknown</option>
          <option value="13">Other (Firearm)</option>
          <option value="14">Handgun</option>
          <option value="15">Automatic Handgun</option>
          <option value="16">Asphyxiation</option>
          <option value="17">Rifle</option>
          <option value="18">Shotgun</option>

        </select>

        {/*Form submit button (KEEP AS TYPE button! breaks otherwise)*/ }
        <input type="button" onClick={startEndDatebga} value="Submit"></input>
      </form>
      
      {/*Crime bar graph display*/}
      <div className='covidagebar'>

        <h4 id="lgraphtitle">Criminal Ages </h4>
        <link rel="stylesheet" href="https://unpkg.com/react-vis/dist/style.css"></link>

        <FlexibleXYPlot xType="ordinal" width={1000} height={300} onMouseLeave={(value)=>setcrimeagehintstyle("hidehint")}>
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
        </FlexibleXYPlot>
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
