from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import between, func
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from datetime import datetime
import pymysql
pymysql.install_as_MySQLdb()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:1234@localhost:3306/crimecovid'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
db.init_app(app)
ma = Marshmallow(app)
CORS(app)


#creates crimecode table
class crimecode(db.Model):
 
    CODE = db.Column(db.String(10), primary_key=True)
    CrimeName = db.Column(db.String(255))

    def __init__(self, CODE, CrimeName):
        self.CODE = CODE
        self.CrimeName = CrimeName

#creates covidcase table   
class covidcase(db.Model):
 
    DayNum = db.Column(db.Integer, primary_key=True)
    DATE = db.Column(db.DateTime)
    TotalCases = db.Column(db.Integer)
    DailyIncrease = db.Column(db.Integer)
    AVGIncrease = db.Column(db.Integer)

    def __init__(self, DayNum, DATE, TotalCases, DailyIncrease, AVGIncrease):
        self.DayNum = DayNum
        self.DATE = DATE
        self.TotalCases = TotalCases
        self.DailyIncrease = DailyIncrease
        self.AVGIncrease = AVGIncrease
        

class CovidSchema(ma.Schema):
    class Meta:
        fields = ('DayNum', 'Date', 'TotalCases', 'DailyIncrease', 'AVGIncrease')

covid_schema = CovidSchema(many=True)

#creates Crime table       
class Crime(db.Model):

    RowID = db.Column(db.Integer, primary_key=True)
    DayNum = db.Column(db.Integer)
    CrimeDate = db.Column(db.DateTime)
    CrimeCode = db.Column(db.String(10))
    Weapon = db.Column(db.Integer)
    Gender = db.Column(db.String(10))
    Age = db.Column(db.Integer)
    District = db.Column(db.String(10))
    Latitude = db.Column(db.Float)
    Longitude = db.Column(db.Float)
    
    def __init__(self, RowID, DayNum, CrimeDate, CrimeCode, Weapon, Gender, Age, District, Latitude, Longitude):
        self.RowID = RowID
        self.DayNum = DayNum
        self.CrimeDate = CrimeDate
        self.CrimeCode = CrimeCode
        self.Weapon = Weapon
        self.Gender = Gender
        self.Age = Age
        self.District = District
        self.Latitude = Latitude
        self.Longitude = Longitude

class CrimeSchema(ma.Schema):
    class Meta:
        fields = ('RowID','DayNum', 'CrimeDate', 'CrimeCode', 'Weapon', 'Gender', 'Age', 'District', 'Latitude', 'Longitude')

crime_schema = CrimeSchema(many=True)

#creates weapons table
class Weapons(db.Model):
    WeaponID = db.Column(db.Integer, primary_key = True)
    Weapons = db.Column(db.String(30))

    def __init__(self, WeaponID, Weapons):
        self.WeaponID = WeaponID
        self.Weapons = Weapons

#Helper function (HEATMAP) for finding the most used weapon with the given filters from the user
def weapon_max(sdate,edate,dist):
    weapon_names = ["N/A","OTHER","FIREARM","KNIFE","HANDS","PERSONAL_WEAPON","FIRE","KNIFE_CUTTING_INSTRUMENT","BLUNT_OBJECT","MOTOR_VEHICLE","DRUGS","UNKOWN","OTHER_FIREAEM","HANDGUN","AUTO_HANDGUN","ASPHYXIATION","RIFLE","SHOTGUN"]
    #query gets all crimes (within filter) and orders them by the frequency in which the weapon occurs. The first index will be a crime that used the weapon with the most occurances  
    curr_weapon = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist)).group_by(Crime.Weapon).order_by(func.count(Crime.Weapon).desc()).all()
    to_use = curr_weapon

    #make sure there is a valid list for checking next element
    if(len(curr_weapon) > 1):
         #dont use Weapon 1 since it is N/A and wouldnt be as useful to the user as a weapon
        if(curr_weapon[0].Weapon == 1):
            to_use = curr_weapon[1].Weapon        
        
            
    #When most frequent weapon is the only weapon available
    else:
        to_use = curr_weapon[0].Weapon
    
    #subtract one since index of weapons cheatsheet starts at 1, but indecies begin at 0
    return weapon_names[to_use - 1]
    
#Helper function (HEATMAP) for finding the most committed crime with the given filters from the user
def crime_max(sdate,edate,dist):
        curr_crime = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist)).group_by(Crime.CrimeCode).order_by(func.count(Crime.CrimeCode).desc()).all()

        temp = curr_crime[0].CrimeCode
        #print(temp)
        
        look_up = crimecode.query.filter(crimecode.CODE.like(temp)).first()

        #print("test ", look_up.CrimeName)
        return look_up.CrimeName

    
#Line graph for covid 1-week average
@app.route('/covidlinegraph', methods=['GET'])
def dateslist():

    #user's input from frontend filter
    sdate = str(request.args.get("startdate"))
    edate = str(request.args.get("enddate"))


    #converting user input from html calendar to DATETIME format to match query
    sdate = sdate.replace("-", "/")
    sdate += " 10:00:00+00"
    edate = edate.replace("-", "/")
    edate += " 10:00:00+00"

    sdate = datetime.strptime(sdate, '%Y/%m/%d %H:%M:%S+%f')
    edate = datetime.strptime(edate, '%Y/%m/%d %H:%M:%S+%f')


    #Query based on datetime to get the DayNum range needed to be used
    startd = covidcase.query.filter_by(DATE = sdate).first()
    endd = covidcase.query.filter_by(DATE = edate).first()

    #get range of daynums for while loop
    startDayNum = int(startd.DayNum)
    endDayNum = int(endd.DayNum)


    rollingavg = []
    
    i = startDayNum
    while i <= endDayNum:
        #adds dictionaries to the list, for x and y coordinate of each point on the graph (x as DATETIME format)
        curr = covidcase.query.get(i)
        dict = {"x": str((curr.DATE)), "y": curr.AVGIncrease}

        rollingavg.append(dict)
        i+=1

    #returning value will populate override the coviddata variable (in App.js) to update the graph
    return jsonify(rollingavg)



# view and Updates bar graph for criminal ages with user input from form 
@app.route('/crimeagebargraph', methods=['GET'])
def agelist():

    #gets user input for start/end date and district
    sdate = str(request.args.get("startdatebga"))
    edate = str(request.args.get("enddatebga"))
    district = str(request.args.get("districtbga"))
    weapon= str(request.args.get("weaponbga"))
    

    #format html calendar input into datetime to query matches
    sdate = datetime.strptime(sdate, '%Y-%m-%d')
    edate = datetime.strptime(edate, '%Y-%m-%d')


    #list to keep track of counts in each category in ranges list
    range_count = [0,0,0,0,0,0,0,0]
    ranges = ["<20","20-25","26-35","36-50","51-60","61-69","70+", "NA"]
    gender_range_count_m = [0,0,0,0,0,0,0,0]
    gender_range_count_f = [0,0,0,0,0,0,0,0]
   

    #queries crime in specified district between start and end date
    if(district != "Al"):
    
        #if specific distric and weapon
        if(weapon != "Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("F")).all()
            
        #if specific district but all weapon
        else:
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district),Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district) ,Crime.Gender.like("F")).all()
            
    #queries crime in ALL districts between start and end date
    else:
        #if all districts and choses specific weapon
        if(weapon !="Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Weapon.like(weapon)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("F")).all()
           
        #if all district and all weapons
        else:   
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Gender.like("F")).all()
            
    #list holds dictionaries to be used as the bar graph's data 
    crime_ages = []
    #list holds disctionaties for genders for bar graph
    crime_gender_m = []
    crime_gender_f = []


    #Increment appropriate age range
    i=0
    male_flag = True
    female_flag = True
   
    while i <= len(allcrime_timepd)-1:
        crime = allcrime_timepd[i]
        age = crime.Age

        if(i >= len(male)):
            male_flag = False
        if(i >= len(female)):
            female_flag = False
       
        if(age < 20 and age > 0):
            range_count[0] +=1
            if(male_flag):
                gender_range_count_m[0] +=1
            if(female_flag):
                gender_range_count_f[0] +=1
          
        elif(age >= 20 and age <= 25):
            range_count[1] +=1
            if(male_flag):
                gender_range_count_m[1] +=1
            if(female_flag):
                gender_range_count_f[1] +=1
           
        elif(age >= 26 and age <=35):
            range_count[2] +=1
            if(male_flag):
                gender_range_count_m[2] +=1
            if(female_flag):
                gender_range_count_f[2] +=1
          
        elif(age >= 36 and age <= 50):
            range_count[3] +=1
            if(male_flag):
                gender_range_count_m[3] +=1
            if(female_flag):
                gender_range_count_f[3] +=1
           
        elif(age >= 51 and age <=60):
            range_count[4] +=1
            if(male_flag):
                gender_range_count_m[4] +=1
            if(female_flag):
                gender_range_count_f[4] +=1
    
        elif(age >= 61 and age <= 69):
            range_count[5] +=1
            if(male_flag):
                gender_range_count_m[5] +=1
            if(female_flag):
                gender_range_count_f[5] +=1

        elif(age >= 70):
            range_count[6] +=1
            if(male_flag):
                gender_range_count_m[6] +=1
            if(female_flag):
                gender_range_count_f[6] +=1
            
        #NA age
        elif(age == 0): 
            range_count[7] +=1
            if(male_flag):
                gender_range_count_m[7] +=1
            if(female_flag):
                gender_range_count_f[7] +=1

        i+=1

    #create dictionary of list of counts per age range
    q = 0
    while q < len(range_count):
        dict = {"x":ranges[q], "y": range_count[q]}
        crime_ages.append(dict)
        
        dict_gender = {"x":ranges[q], "y": gender_range_count_m[q]}
        crime_gender_m.append(dict_gender)
        dict_gender_f = {"x":ranges[q], "y": gender_range_count_f[q]}
        crime_gender_f.append(dict_gender_f)     
        
        q+=1

    #returning value will populate or override the crimeagebar variable (in App.js) to update the bar graph
    #return crime_ages
    combine = []
    combine.append(crime_gender_m)
    combine.append(crime_gender_f)

    to_return = []
    to_return.append(crime_ages)
    to_return.append(combine)

    return to_return


@app.route('/heatmapmarkers', methods=['GET'])
def heatmapmarkers():

    sdate = str(request.args.get("startdateheat"))
    edate = str(request.args.get("enddateheat"))
    district = str(request.args.get("districtheat"))
    weapon = str(request.args.get("weaponheat"))

    #Each index corresponds to a counter for that district [N,S,E,W,NE,NW,SE,SW,C]
    district_markers_test = [0,0,0,0,0,0,0,0,0]
    district_markers_max_weapon = ['','','','','','','','','']
    district_markers_max_crimecode = ['','','','','','','','','']


    #District names used for querying all districts for crime counts
    districts_name = ['N','S','E','W','NE','NW','SE','SW','C']

    #format html calendar input into datetime to query matches
    sdate = datetime.strptime(sdate, '%Y-%m-%d')
    edate = datetime.strptime(edate, '%Y-%m-%d')

    #queries crime in SPECIFIC district between start and end date
    if(district != "Al"):
        
        #if SPECIFIC distric and SPECIFIC weapon
        if(weapon != "Al"):
            heat_crime = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon)).all()

            #get crime counts for SPECIFIC district and SPECIFIC weapon
            x = 0
            for dist in districts_name:
                if(dist == district):
                    temp = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon)).count()
                    district_markers_test[x] = temp

                    #NOTE: eventhough there is a specified weapon, it would be more useful for the user to know the most used weapon OVERALL instead of just redisplaying their currently selected weapon
                    district_markers_max_weapon[x] = weapon_max(sdate,edate,dist)
                    district_markers_max_crimecode[x] = crime_max(sdate,edate,dist)

                else:
                    district_markers_test[x] = 0
                    district_markers_max_weapon[x] = ""
                    district_markers_max_crimecode[x] = ""

                x+=1
            
        #if SPECIFIC district but ALL weapon
        else:
            heat_crime = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district)).all()

            #get crime count for SPECIFIC district and ALL weapons
            x = 0
            for dist in districts_name:
                if(dist == district):
                    temp = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist)).count()
                    district_markers_test[x] = temp
                    district_markers_max_weapon[x] = weapon_max(sdate,edate,dist)
                    district_markers_max_crimecode[x] = crime_max(sdate,edate,dist)


                else:
                    district_markers_test[x] = 0
                    district_markers_max_weapon[x] = ""
                    district_markers_max_crimecode[x] = ""
                x+=1


    #Queries ALL crime committed between two dates given by user for ALL districts
    else:

        #if ALL districts and choses SPECIFIC weapon
        if(weapon !="Al"):
            heat_crime = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Weapon.like(weapon)).all()
            
            #get crime count for ALL district with SPECIFIC weapon
            x=0
            for dist in districts_name:
                curr = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist),Crime.Weapon.like(weapon)).count()
                district_markers_test[x] = curr


                #NOTE: eventhough there is a specified weapon, it would be more useful for the user to know the most used weapon OVERALL instead of just redisplaying their currently selected weapon
                #query gets all crimes (within filter) and orders them by the frequency in which the weapon occurs. The first index will be a crime that used the weapon with the most occurances  
                district_markers_max_weapon[x] = weapon_max(sdate,edate,dist)
                district_markers_max_crimecode[x] = crime_max(sdate,edate,dist)

                
                x+=1


        #if ALL district and ALL weapons
        else:   
            heat_crime = Crime.query.filter(Crime.CrimeDate.between(sdate,edate)).all()
            #print(len(heat_crime))

            #get crime count for each district with ALL weapons
            x=0
            for dist in districts_name:
                curr = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist)).count()
                district_markers_test[x] = curr

                district_markers_max_weapon[x] = weapon_max(sdate,edate,dist)
                district_markers_max_crimecode[x] = crime_max(sdate,edate,dist)

                x+=1


    #2-D list. Each row is a pair of latitude, logitude, and intensity of the marker ([lat,long,intensity])
    crime_list = []
    

    q = 0
    while q <= len(heat_crime)-1:   

        #has to be sent in format [Lat,Long,Intensity]     
        crime_list.append([heat_crime[q].Latitude,heat_crime[q].Longitude,"0.00001"])
        q+=1
    
    
    #list of 4 indecies. 
    # First element crime ([lat,long,intensity]) for each crime (2-d list). 
    # Second element number of crimes per district to display ([N,E,S,W,NE,NW,SE,SW,C])
    #third element is a list if the most frequent weapon in each district ([N,E,S,W,NE,NW,SE,SW,C])
    #fourth element is the most committed crime in each district ([N,E,S,W,NE,NW,SE,SW,C])
    test_list = []
    test_list.append(crime_list)
    test_list.append(district_markers_test)
    test_list.append(district_markers_max_weapon)
    test_list.append(district_markers_max_crimecode)

    #return list with fist index for heatmap location data, second index for district marker count
    return test_list




#ADMIN CONTROLS#######################################################################################################################################

#CREATE: CRIME
@app.route('/admincreatecrime', methods=['GET'])
def admincreatecrime():

    daynum =  str(request.args.get("daynum"))
    crimedatetime = str(request.args.get("crimedatetime"))
    crimedatetime= datetime.strptime(crimedatetime, '%Y-%m-%d')
    crime_code = str(request.args.get("crimecode"))
    createweapon =  str(request.args.get("createweapon"))
    gender =  str(request.args.get("gender"))
    age =  str(request.args.get("age"))
    district =  str(request.args.get("district"))
    lat =  str(request.args.get("lat"))
    longi =  str(request.args.get("longi"))

    rowid = Crime.query.count()
    rowid += 1

    #if not valid crimcode, do not insert. Will alert user
    if(not crimecode.query.filter(crimecode.CODE.like(crime_code)).first()):
        return "NO Crimecode"

    temp = Crime(rowid, daynum, crimedatetime, crime_code, createweapon, gender, age, district, lat, longi)
    db.session.add(temp)
    db.session.commit()

    return "It worked!"

#DELETE: CRIME
@app.route('/admindeletecrime', methods=['GET'])
def admindeletecrime():

    start =  int(request.args.get("crimedelstart"))
    end = int(request.args.get("crimedelend"))

    #Check if start RowID is valid
    exists = Crime.query.filter(Crime.RowID.like(start)).first()
    if(not exists):
        return "NO Start"

    #check if end RowID is valid 
    exists = Crime.query.filter(Crime.RowID.like(end)).first()
    if(not exists):
        return "NO End"
    

    #delete crime rows between given start and end RowIDs
    while start <= end:

        #verifies if the row exists, if it does, delete between range
        exists = Crime.query.filter(Crime.RowID.like(start)).first()
        if(exists):
            to_delete = Crime.query.get(start)
            db.session.delete(to_delete)


        start +=1

    db.session.commit()

    return "It worked!" 

#CREATE: COVID
@app.route('/admincreatecovid', methods=['GET'])
def admincreatecovid():

    daynum =  int(request.args.get("daynumcovid"))

    #format date for querying
    date =  str(request.args.get("datetimecovid"))
    date = date.replace("-", "/")
    date += " 10:00:00+00"
    date = datetime.strptime(date, '%Y/%m/%d %H:%M:%S+%f')

    dailyincrease =  int(request.args.get("dailyincrease"))

    #if there is not a previous daynum, do not insert. Will alert user
    if(not covidcase.query.filter(covidcase.DayNum.like(daynum - 1)).first()):
        return "NO Previous"


    #if daynum already exists, do not insert. Will alert user
    if(covidcase.query.filter(covidcase.DayNum.like(daynum)).first()):
        return "NO Exists"

    #calculate 7-day average increase
    x = 0
    sum = 0
    divisor = 0
    while x <= 7:

        exists = covidcase.query.filter(covidcase.DayNum.like(daynum - x)).first()
        if(exists):
            sum  += covidcase.query.get(daynum-x).AVGIncrease
            divisor +=1
        x+=1

    avg = int(sum/divisor)
    #print("sum = ", sum , " divisor = ", divisor)

    #if previous exists, calculate total increase
    if(covidcase.query.filter(covidcase.DayNum.like(daynum - 1)).first()):
        prev_covid = covidcase.query.get(daynum-1)
        prev_covid = prev_covid.TotalCases
        totalcases = dailyincrease + prev_covid
    
    #if previous day doesnt exist, get the last valid day for its total cases. (THIS CASE SHOULD NEVER HAPPEN DUE TO BOUNDS CHECKS)
    else:
        maxdayentry = covidcase.query.filter(covidcase.DayNum.like(covidcase.query.count())).first()
        totalcases = dailyincrease + maxdayentry.TotalCases



    temp = covidcase(daynum,date,totalcases,dailyincrease,avg)

    db.session.add(temp)
    db.session.commit()

    return "It worked!"

#DELETE: COVID
@app.route('/admindeletecovid', methods=['GET'])
def admindeletecovid():

    start =  int(request.args.get("coviddelstart"))
    end = int(request.args.get("coviddelend"))

    #Check if start daynum is valid
    exists = covidcase.query.filter(covidcase.DayNum.like(start)).first()
    if(not exists):
        return "NO Start"

    #check if end daynum is valid 
    exists = covidcase.query.filter(covidcase.DayNum.like(end)).first()
    if(not exists):
        return "NO End"
    
    while start <= end:

        #verifies if the row exists, if it does, delete between range
        exists = covidcase.query.filter(covidcase.DayNum.like(start)).first()
        if(exists):
            to_delete = covidcase.query.get(start)
            db.session.delete(to_delete)


        start +=1

    db.session.commit()

    return "It worked!"


        
if __name__ == "__main__":
    app.run(debug=True)