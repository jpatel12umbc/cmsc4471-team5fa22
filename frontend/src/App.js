import './App.css';
import React,{useRef, useEffect, useState,setState} from 'react';
import Axios from 'axios';
import {XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, LineSeries, VerticalBarSeries,FlexibleXYPlot,Hint} from "react-vis";
import { MapContainer, TileLayer, Map, Marker, Popup, ZoomControl, ScaleControl} from 'react-leaflet'
import '../node_modules/leaflet/dist/leaflet.css'
import {HeatmapLayer} from "react-leaflet-heatmap-layer-v3/lib";
import icon from '../node_modules/leaflet/dist/images/marker-icon.png';
import iconShadow from '../node_modules/leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';

function App(){
  
  //stores currently graphed covid weekly avg increase (the line graph)
  const [coviddata, setcoviddata] = useState([]);
  //stores start and end date respectively for covid line graph
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');


  //stores currently graphed criminal age (the age bar graph)
  const [crimeagebar, setcrimeagebar] = useState([]);
  //stores current graphed criminal gender based on age (Age bar graph)
  const [crimegenderbar_m, setcrimegenderbar_m] = useState([]);
  const [crimegenderbar_f, setcrimegenderbar_f] = useState([]);

  //stores start and end date respectively for crime bargraph age (bga) and district
  const [endDatebga, setEndDatebga] = useState('');
  const [startDatebga, setStartDatebga] = useState('');
  const [districtbga, setdistrictbga] = useState('');
  const [weaponbga, setweaponbga] = useState('');

  //stores currently mapped heatmap, gets updated when filter is applied
  const [heatmap, setheatmap] = useState([]);
  //stores start/end date and selected district for heatmap
  const [startDateheat, setStartDateheat] = useState('');
  const [endDateheat, setEndDateheat] = useState('');
  //stores district and weapon respectively for heatmap
  const [districtheat, setdistrictheat] = useState('');
  const [weaponheat, setweaponheat] = useState('');
  //stores crime count for each district with current filters applied to be shown on heatmap  (in format [N,S,E,W,NE,NW,SE,SW,C]) (int)
  const [district_marker_count, setdistrict_marker_count] = useState([]);
  //stores most frequently used weapon for each district with current filters applied to be shown on heatmap  (in format [N,S,E,W,NE,NW,SE,SW,C]) (string)
  const[district_marker_max_weapon, setdistrict_marker_max_weapon] = useState([]);
  //stores most committed crime in  each district with current filters applied to be shown on heatmap  (in format [N,S,E,W,NE,NW,SE,SW,C]) (string)
  const[district_marker_max_crimecode, setdistrict_marker_max_crimecode] = useState([]);

  //a temporary variable for district_marker_count to help with order of execution (useState for some reason execute in a different order)
  var temp_dist_marker_count = [];
  const [opacity_list, setopacity_list] = useState([])
  
  
  //values used to store Hint data covid line graph (for prompt when mousing over graphs)
  const [currval, setCurrval] = useState({});
  //Used for covid line graph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const [covidlhintstyle,setcovidlhintstyle] = useState('hidehint'); //default state set to hide prompt before mousing over
  const hinthandlecovidl = (val,cssClassname)=>{
    setCurrval(val)
    setcovidlhintstyle(cssClassname)
  }

  //values used to store Hint data crimeage graph (for prompt when mousing over graphs)
  const [currbarval, setCurrbarval] = useState({});
  //Used for age crime bargraph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const [crimeagehintstyle,setcrimeagehintstyle] = useState('hidehint');  //default state set to hide prompt before mousing over
  const hinthandlecrimeage = (val,cssClassname)=>{
    setCurrbarval(val)
    setcrimeagehintstyle(cssClassname)
  }
  //values used to store Hint data crimeage graph (for prompt when mousing over graphs)
  const [currbarvalm, setCurrbarvalm] = useState({});
  //Used for age crime bargraph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const hinthandlecrimem = (val,cssClassname)=>{
    setCurrbarvalm(val)
    setcrimeagehintstyle(cssClassname)
  }
  //values used to store Hint data crimeage graph (for prompt when mousing over graphs)
  const [currbarvalf, setCurrbarvalf] = useState({});
  //Used for age crime bargraph. Used to set the current x and y to be displayed in graph and sets what css classname to have (used to hide hint when mouse leaves graph)
  const hinthandlecrimef = (val,cssClassname)=>{
    setCurrbarvalf(val)
    setcrimeagehintstyle(cssClassname)
  }

  //default variables used for running graphs on website start up
  const defaultStart = "2020-03-15"
  const defaultEnd = "2020-04-15"
  const defaultdist = "Al" //Al for ALL disctricts
  const defaultweapon = "Al" //Al for ALL weapons
  const Baltimore_position = [39.2904,-76.6122]
  //coordinates for each district's marker on heatmap (set to corresponding districts police station. Was easiest/relavent to do)
  const C_coords = [39.29040060714916, -76.6083176460339]
  const N_coords = [39.34327061854928, -76.65227776931071]
  const S_coords = [39.25294073387729, -76.61716571349152]
  const E_coords = [39.30984494938172, -76.57341682883616]
  const W_coords = [39.30073509254237, -76.64440801103035]
  const NE_coords = [39.34096873001896, -76.58257950917572]
  const NW_coords = [39.34474923684397, -76.68489303245235]
  const SE_coords = [39.28790141779125, -76.54715550547152]
  const SW_coords = [39.2784977311718, -76.66355846870357]

//Creates a pin icon for Marker
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  //iconSize: [25, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


//(used in Heatmap)this function will check all of the crime counts for each district (stored in temp_dist_marker_count). If the district has 0 crimes, set its corresponding opacity to 0 to make it invisible. 
const marker_check = () =>{

  //Each index corresponds to an opacity for that district's marker on the heatmap [N,S,E,W,NE,NW,SE,SW,C]
  const temp_list = [0,0,0,0,0,0,0,0,0]


  for(let i=0; i < temp_dist_marker_count.length; i++){
    if(temp_dist_marker_count[i] > 0){
      //console.log(district_marker_count[i] , " if")
      temp_list[i] = 100;
    }
    else{
      temp_list[i] = 0
      //console.log(district_marker_count[i] , " else")
    }
  }
  console.log("temp_list at end = ", temp_list)
  setopacity_list(temp_list)
}
  
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
      setcrimeagebar(response.data[0])
      setcrimegenderbar_m(response.data[1][0])
      //console.log("male!",response.data[1][0])
      setcrimegenderbar_f(response.data[1][1])
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
        setcrimeagebar(response.data[0])
        setcrimegenderbar_m(response.data[1][0])
        console.log("just age",response.data[0])
        console.log("male!",response.data[1][0])
        setcrimegenderbar_f(response.data[1][1])
            
        console.log(response.status)
      }
      ).catch(function (error) {
      console.log("Error displaying default Crime Age Bar Graph. Page was refreshed before the queries in the backend could be completed.");
      });
  },[]);



  //Sets default heatmap for default dates and all districts to be displayed
  useEffect(() => {
    Axios.get("http://127.0.0.1:5000/heatmapmarkers", {params:{
      startdateheat: defaultStart, 
      enddateheat: defaultEnd,
      districtheat: defaultdist,
      weaponheat: defaultweapon}
    }).then((response) => {
        //override heatmap with [lat.long,intensity]
        setheatmap(response.data[0])

        //override count of crimes for markers on heatmap
        setdistrict_marker_count(response.data[1])
        setdistrict_marker_max_weapon(response.data[2])
        setdistrict_marker_max_crimecode(response.data[3])

        //have to use temp variable to correctly check the markers since actions can be done out of order when using useeffects (is safe to use district_marker_count in HTML part of code! Temp var is out of scop of HTML)
        temp_dist_marker_count = response.data[1]
        marker_check()
        console.log(response.data[2])
      }
    )
  },[]);

  //Updates heatmap variable with new parameters, will change currently displayed heatmap.
  const startEndDateheat = () =>{
    //checking if valid end and start date
    if(endDateheat < startDateheat){
      console.log("User entered invalid start and end dates",  endDateheat)
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
      //Overrides stored data in heatmap variable with [lat,long,intensity]
      setheatmap(response.data[0])

      //override count of crimes for markers on heatmap 
      setdistrict_marker_count(response.data[1])
      setdistrict_marker_max_weapon(response.data[2])
      setdistrict_marker_max_crimecode(response.data[3])


      //have to use temp variable to correctly check the markers since actions can be done out of order when using useeffects (is safe to use district_marker_count in HTML part of code! Temp var is out of scop of HTML)
      temp_dist_marker_count = response.data[1]
      console.log(temp_dist_marker_count)
      marker_check()
      })
    }

  }
  const [daynum, setdaynum] = useState('')
  const[crimedatetime, setcrimedatetime] = useState('')
  const[crimecode, setcrimecode] = useState('')
  const[createweapon, setcreateweapon] = useState('')
  const[gender, setgender] = useState('')
  const[age, setage] = useState('')
  const[district, setdistrict] = useState('')
  const[lat, setlat] = useState('')
  const[longi, setlongi] = useState('')


  const [adminstyle, setadminstyle] = useState('hidehint')
  const [passwordattempt,setpasswordattempt] = useState('')
  const [usernameattempt, setusernameattempt] = useState('')
  const adminlogin = () =>{
    if(passwordattempt === "admin" && usernameattempt === "admin"){
      //correct password

      //set style to visible for creating and deleting
      setadminstyle("app")

    }
    else{
      alert("Incorrect username and/or password")
    }
    
  }

  const admincreatecrime = () => {

    if(daynum === "" || crimedatetime === "" || crimecode === "" || createweapon === "" || gender === "" || age === "" || district === "" || lat === "" || longi === ""){
      alert("please enter all fields")
    }
    else{
      Axios.get('http://127.0.0.1:5000/admincreatecrime', {params:{
        daynum:daynum,
        crimedatetime:crimedatetime,
        crimecode:crimecode,
        createweapon:createweapon,
        gender:gender,
        age:age,
        district:district,
        lat:lat,
        longi:longi}
        }).then((response) => {
          console.log(response.status)
          if(response.data === "NO Crimecode"){
            alert("Please enter a valid crimecode")
          }
          if(response.data === "It worked!"){
            alert("Success!")
          }
        })
    }


  }

  const [crimedelstart, setcrimedelstart] = useState('')
  const [crimedelend, setcrimedelend] = useState('')

  const admindeletecrime = () => {
    
    if(crimedelend === "" || crimedelstart === "" || crimedelend < crimedelstart){
      alert("please enter all fields. Make sure end value is greater than start")
    }
    else{
      Axios.get('http://127.0.0.1:5000/admindeletecrime', {params:{
        crimedelstart:crimedelstart,
        crimedelend:crimedelend}
        }).then((response) => {
          console.log(response.status)
          if(response.data === "NO Start"){
            alert("Start RowID not valid")
          }
          if(response.data === "NO End"){
            alert("End RowID not valid")
          }
          if(response.data === "It worked!"){
            alert("Success!")
          }
        })
    }
  }

  const [daynumcovid, setdaynumcovid] = useState('')
  const [datetimecovid, setdatetimecovid] = useState('')
  const [dailyincrease, setdailyincrease] = useState('')
  const [avgincrease, setavgincrease] = useState('')

  const admincreatecovid = () => {
    if(daynumcovid === "" || datetimecovid === "" || dailyincrease === "" ){//|| dailyincrease === "" || avgincrease === ""){
      alert("please enter all fields.")
    }
    else{
      Axios.get('http://127.0.0.1:5000/admincreatecovid', {params:{
        daynumcovid:daynumcovid,
        datetimecovid:datetimecovid,
        dailyincrease:dailyincrease}
        //dailyincrease:dailyincrease,
        //avgincrease:avgincrease}
        }).then((response) => {
          console.log(response.status)
          if(response.data === "NO Exists"){
            alert("DayNum already in use")
          }
          if(response.data === "NO Previous"){
            alert("There is not a previous DayNum")
          }
          if(response.data === "It worked!"){
            alert("Success!")
          }
        })
    }
    

  }

  const [coviddelstart, setcoviddelstart] = useState('')
  const [coviddelend, setcoviddelend] = useState('')

  const admindeletecovid = () => {

    if(coviddelend === "" || coviddelstart === "" || coviddelend < coviddelstart){
      alert("please enter all fields. Make sure end value is greater than start")
    }
    else{
      Axios.get('http://127.0.0.1:5000/admindeletecovid', {params:{
        coviddelstart:coviddelstart,
        coviddelend:coviddelend}
        }).then((response) => {
          console.log(response.status)
          if(response.data === "NO Start"){
            alert("Start DayNum not valid")
          }
          if(response.data === "NO End"){
            alert("End DayNum not valid")
          }
          if(response.data === "It worked!"){
            alert("Success!")
          }
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
          <option value="12">Unknown</option>

        </select>

        {/*Form submit button (KEEP AS TYPE button! breaks otherwise)*/ }
        <input type="button" onClick={startEndDateheat} value="Submit"></input>
      </form>

      
  
      {/* Title heatmap*/}
      <h3 id="lgraphtitle">Baltimore City Violent Crime </h3>

      {/*Leaflet-react Map with heatmap layer */}
      <div className="heatmap">
        {/*Create Map*/}
        <MapContainer center={Baltimore_position} zoom={12} scrollWheelZoom={true} zoomControl={false} wheelPxPerZoomLevel={100}> 

        <ZoomControl position='topright'></ZoomControl>

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


          {/*These markers represent each district on the heatmap. The opacity will be either 0 or 100 depending on if it needs to be present or not.
           A marker is not present if the crime count for the district is 0 (e.g. only north marker will show if the specified district is notrhern) */}
          <Marker position={N_coords} opacity={opacity_list[0]}> <Popup> Northern <br></br>Total Crimes: {district_marker_count[0]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[0]} <br></br> Most Frequent Crime: {district_marker_max_crimecode[0]}</Popup></Marker>
          <Marker position={S_coords} opacity={opacity_list[1]}><Popup> Southern <br></br>Total Crimes: {district_marker_count[1]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[1]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[1]}</Popup></Marker>
          <Marker position={E_coords} opacity={opacity_list[2]}><Popup> Eastern <br></br>Total Crimes: {district_marker_count[2]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[2]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[2]}</Popup></Marker>
          <Marker position={W_coords} opacity={opacity_list[3]}><Popup> Western <br></br>Total Crimes: {district_marker_count[3]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[3]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[3]} </Popup></Marker>
          <Marker position={NE_coords} opacity={opacity_list[4]}><Popup> North Eastern <br></br>Total Crimes: {district_marker_count[4]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[4]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[4]} </Popup></Marker>
          <Marker position={NW_coords} opacity={opacity_list[5]}><Popup> North Western <br></br>Total Crimes: {district_marker_count[5]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[5]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[5]} </Popup></Marker>
          <Marker position={SE_coords} opacity={opacity_list[6]}><Popup> South Eastern <br></br>Total Crimes: {district_marker_count[6]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[6]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[6]} </Popup></Marker>
          <Marker position={SW_coords} opacity={opacity_list[7]}><Popup> South Western <br></br>Total Crimes: {district_marker_count[7]} <br></br>Most Frequent Weapon: {district_marker_max_weapon[7]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[7]} </Popup></Marker>
          <Marker position={C_coords} opacity={opacity_list[8]}><Popup> Central <br></br>Total Crimes: {district_marker_count[8]} <br></br>Most used Weapon: {district_marker_max_weapon[8]}<br></br> Most Frequent Crime: {district_marker_max_crimecode[8]} </Popup></Marker>

    
          
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
          
          {/*Setting the data dictionary to be displayed({"x": date, "y": avgincrease}). Also setting currval to nearest point to cursor and sets css class to display*/}  
          <LineSeries data={coviddata} 
            onNearestX={(value) =>  hinthandlecovidl(value,"hintprompt")}
            />

          <XAxis  title="Date" 
            tickLabelAngle={-90}
            tickFormat={function tickFormat(currdate){return new Date(currdate).toLocaleDateString()}}
            attr="x" attrAxis="y" 
            orientation="bottom"/>

          <YAxis headLine title="1-Week Average Increase" />

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
          <option value="12">Unknown</option>

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
          

          {/*Setting the data dictionary to be displayed. X is category, Y is #of occurences ({"x": age-category, "y": #of occurences})
          Cursor will change displayed hint value and set correct css style to not be hidden*/}  
          <VerticalBarSeries data={crimeagebar}
            onNearestX={(value) => hinthandlecrimeage(value,"hintprompt")}/>
          <VerticalBarSeries data={crimegenderbar_m} color="lightblue"
            onNearestX={(value) => hinthandlecrimem(value,"hintprompt")}/>
          <VerticalBarSeries data={crimegenderbar_f} color="pink"
            onNearestX={(value) => hinthandlecrimef(value,"hintprompt")}/>
          {/*
          <VerticalBarSeries data={crimegenderbar_u}
            onNearestX={(value) => hinthandlecrimeage(value,"hintprompt")}/>
          <VerticalBarSeries data={crimegenderbar_na}
            onNearestX={(value) => hinthandlecrimeage(value,"hintprompt")}/>    
        */}  

          <XAxis  title="Ages"  />
          <YAxis headLine title="Count"/>

          {/*Outputs data from currval*/}
          <Hint value={currbarval} marginLeft={0} marginTop={0}>
            <div className={crimeagehintstyle}>
              <h3 className='hinttitle'>Total:</h3>
              <p>{currbarval.y}</p>
              <h3 className='hinttitle'>Male:</h3>
              <p>{currbarvalm.y}</p>
              <h3 className='hinttitle'>Female:</h3>
              <p>{currbarvalf.y}</p>
            </div>
          </Hint>
        </FlexibleXYPlot>
      </div>
 


{/*ADMIN LOGIN ***********************************************************************************************************/}
      <div>
        <h4> admin login</h4>
        <form className='adminlogin'>

          <label>Username:</label>
          <input type={"text"} onChange={(e) =>{
          setusernameattempt(e.target.value)}}>
          </input>

          <label>Password:</label>
          <input type={"text"} onChange={(e) =>{
          setpasswordattempt(e.target.value)}}>
          </input>

          <input type="button" onClick={adminlogin} value="Submit"></input>
        </form>


        {/* CREATE for Crime table*/}
        <form className={adminstyle}>
        <h4>Create: Crime Table</h4>

            <label>DayNum:</label>
            <input type="number" onChange={(e) =>{
          setdaynum(e.target.value)}}></input> <br></br>

            <label>Crimedate:</label>
            <input type="date" onChange={(e) =>{
          setcrimedatetime(e.target.value)}}></input> <br></br>

            <label>CrimeCode</label>
            <input type="text" onChange={(e) =>{
          setcrimecode(e.target.value)}}></input> <br></br>

            <label>Weapon:</label>
            <select required type="" name="weapon"
            onChange={(e) =>{
                setcreateweapon(e.target.value)
            }}>
              <option value=""  defaultValue={""} >Select Weapon</option>
              <option value="1">None</option>
              <option value="2">Other</option>
              <option value="3">Firearm</option>
              <option value="4">Knife</option>
              <option value="5">Hands</option>
              <option value="6">Personal Weapon</option>
              <option value="7">Fire</option>
              <option value="12">Unknown</option>
            </select> <br></br>

            <label>Gender:</label>
            <select required type="" name="gender"
            onChange={(e) =>{
                setgender(e.target.value)
            }}>
              <option value=""  defaultValue={""} >Select Weapon</option>
              <option value="M">M</option>
              <option value="F">F</option>
              <option value="U">U</option>
              <option value="N">N/A</option>
            </select> <br></br>

            <label>Age:</label>
            <input type="number" onChange={(e) =>{
          setage(e.target.value)}}></input> <br></br>

            <label>District:</label>
            <select required type="" name="district"
            onChange={(e) =>{
                setdistrict(e.target.value)
            }}>
              <option value=""  defaultValue={""} >Select District</option>
              <option value="N">Northern</option>
              <option value="S">Southern</option>
              <option value="E">Eastern</option>
              <option value="W">Western</option>
              <option value="NE">NorthEastern</option>
              <option value="NW">NorthWestern</option>
              <option value="SE">SouthEaster</option>
              <option value="SW">SouthWestern</option>
              <option value="C">Central</option>
            </select> <br></br>

            <label>Latitude:</label>
            <input type="float" onChange={(e) =>{
          setlat(e.target.value)}}></input> <br></br>

            <label>Longitude:</label>
            <input type="float" onChange={(e) =>{
          setlongi(e.target.value)}}></input> <br></br>

          <input type="button" onClick={admincreatecrime} value="Submit"></input>
        </form>


        {/*DELETE Crime table */}
        <form className={adminstyle}>
        <h4>Delete: Crime Table</h4>

            <label>Start RowID:</label>
            <input type="number" onChange={(e) =>{
          setcrimedelstart(e.target.value)}}></input> <br></br>

            <label>End RowID:</label>
            <input type="number" onChange={(e) =>{
          setcrimedelend(e.target.value)}}></input> <br></br>


          <input type="button" onClick={admindeletecrime} value="Submit"></input>
        </form>


        {/*CREATE Covid */}
        <form className={adminstyle}>
        <h4>Create: Covid Table</h4>

          <label>DayNum:</label>
            <input type="number" onChange={(e) =>{
            setdaynumcovid(e.target.value)}}></input> <br></br>
            
          <label>Date:</label>
            <input type="date" onChange={(e) =>{
            setdatetimecovid(e.target.value)}}></input> <br></br>

          <label>dailyincrease:</label>
            <input type="number" onChange={(e) =>{
            setdailyincrease(e.target.value)}}></input> <br></br>
          
          <input type="button" onClick={admincreatecovid} value="Submit"></input>
        </form>  

        {/*DELETE Covid */}
        <form className={adminstyle}>
        <h4>Create: Covid Table</h4>

        <label>Start DayNum:</label>
            <input type="number" onChange={(e) =>{
          setcoviddelstart(e.target.value)}}></input> <br></br>

            <label>End DayNum:</label>
            <input type="number" onChange={(e) =>{
          setcoviddelend(e.target.value)}}></input> <br></br>
          
          <input type="button" onClick={admindeletecovid} value="Submit"></input>
        </form>                


      </div>

    </div>
  );
}

export default App;
