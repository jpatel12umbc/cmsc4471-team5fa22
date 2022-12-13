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
    
    #print(weapon)

    #format html calendar input into datetime to query matches
    sdate = datetime.strptime(sdate, '%Y-%m-%d')
    edate = datetime.strptime(edate, '%Y-%m-%d')


    #list to keep track of counts in each category in ranges list
    range_count = [0,0,0,0,0,0,0,0]
    ranges = ["<20","20-25","26-35","36-50","51-60","61-69","70+", "NA"]
    gender_range_count_m = [0,0,0,0,0,0,0,0]
    gender_range_count_f = [0,0,0,0,0,0,0,0]
    #gender_range_count_u = [0,0,0,0,0,0,0,0]
    #gender_range_count_na = [0,0,0,0,0,0,0,0]


    #queries crime in specified district between start and end date
    if(district != "Al"):
    
        #if specific distric and weapon
        if(weapon != "Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("F")).all()
            #unknown = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("U")).all()
            #not_available = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon) ,Crime.Gender.like("N")).all()
        #if specific district but all weapon
        else:
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district),Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district) ,Crime.Gender.like("F")).all()
            #unknown = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district) ,Crime.Gender.like("U")).all()
            #not_available = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district) ,Crime.Gender.like("N")).all()

    #queries crime in ALL districts between start and end date
    else:
        #if all districts and choses specific weapon
        if(weapon !="Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Weapon.like(weapon)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("F")).all()
            #unknown = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("U")).all()
            #not_available = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Weapon.like(weapon) ,Crime.Gender.like("N")).all()

        #if all district and all weapons
        else:   
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate)).all()
            male = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Gender.like("M")).all()
            female = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Gender.like("F")).all()
            #unknown = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Gender.like("U")).all()
            #not_available = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.Gender.like("N")).all()

    #list holds dictionaries to be used as the bar graph's data 
    crime_ages = []
    #list holds disctionaties for genders for bar graph
    crime_gender_m = []
    crime_gender_f = []
    #crime_gender_u = []
    #crime_gender_na = []

    

    #Increment appropriate age range
    i=0
    male_flag = True
    female_flag = True
    #unknown_flag = True
    #na_flag = True
    while i <= len(allcrime_timepd)-1:
        crime = allcrime_timepd[i]
        age = crime.Age

        if(i >= len(male)):
            male_flag = False
        if(i >= len(female)):
            female_flag = False
        #if(i >= len(unknown)):
        #    unknown_flag = False
        #if(i >= len(not_available)):
        #    na_flag = False

        if(age < 20 and age > 0):
            range_count[0] +=1
            if(male_flag):
                gender_range_count_m[0] +=1
            if(female_flag):
                gender_range_count_f[0] +=1
            #if(unknown_flag):
            #    gender_range_count_u[0] +=1
            #if(na_flag):
            #    gender_range_count_na[0] +=1

        elif(age >= 20 and age <= 25):
            range_count[1] +=1
            if(male_flag):
                gender_range_count_m[1] +=1
            if(female_flag):
                gender_range_count_f[1] +=1
            #if(unknown_flag):
            #    gender_range_count_u[1] +=1
            #if(na_flag):
            #    gender_range_count_na[1] +=1

        elif(age >= 26 and age <=35):
            range_count[2] +=1
            if(male_flag):
                gender_range_count_m[2] +=1
            if(female_flag):
                gender_range_count_f[2] +=1
            #if(unknown_flag):
            #    gender_range_count_u[2] +=1
            #if(na_flag):
            #    gender_range_count_na[2] +=1

        elif(age >= 36 and age <= 50):
            range_count[3] +=1
            if(male_flag):
                gender_range_count_m[3] +=1
            if(female_flag):
                gender_range_count_f[3] +=1
            #if(unknown_flag):
            #   gender_range_count_u[3] +=1
            #if(na_flag):
            #    gender_range_count_na[3] +=1

        elif(age >= 51 and age <=60):
            range_count[4] +=1
            if(male_flag):
                gender_range_count_m[4] +=1
            if(female_flag):
                gender_range_count_f[4] +=1
            #if(unknown_flag):
            #    gender_range_count_u[4] +=1
            #if(na_flag):
            #    gender_range_count_na[4] +=1

        elif(age >= 61 and age <= 69):
            range_count[5] +=1
            if(male_flag):
                gender_range_count_m[5] +=1
            if(female_flag):
                gender_range_count_f[5] +=1
            #if(unknown_flag):
            #    gender_range_count_u[5] +=1
            #if(na_flag):
            #    gender_range_count_na[5] +=1

        elif(age >= 70):
            range_count[6] +=1
            if(male_flag):
                gender_range_count_m[6] +=1
            if(female_flag):
                gender_range_count_f[6] +=1
            #if(unknown_flag):
            #    gender_range_count_u[6] +=1
            #if(na_flag):
            #    gender_range_count_na[6] +=1

        #NA age
        elif(age == 0): 
            range_count[7] +=1
            if(male_flag):
                gender_range_count_m[7] +=1
            if(female_flag):
                gender_range_count_f[7] +=1
            #if(unknown_flag):
            #    gender_range_count_u[7] +=1
            #if(na_flag):
            #    gender_range_count_na[7] +=1

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
        #dict_gender_u = {"x":ranges[q], "y": gender_range_count_u[q]}
        #crime_gender_u.append(dict_gender_u)
        #dict_gender_na = {"x":ranges[q], "y": gender_range_count_na[q]}
        #crime_gender_na.append(dict_gender_na)        
        
        q+=1

    #returning value will populate or override the crimeagebar variable (in App.js) to update the bar graph
    #return crime_ages
    combine = []
    #combine.append(crime_ages)
    combine.append(crime_gender_m)
    combine.append(crime_gender_f)
    #combine.append(crime_gender_u)
    #combine.append(crime_gender_na)

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


                #query gets all crimes (within filter) and orders them by the frequency in which the weapon occurs. The first index will be a crime that used the weapon with the most occurances  
                #curr_weapon = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(dist)).group_by(Crime.Weapon).order_by(func.count(Crime.Weapon).desc()).all()
                #to_use = curr_weapon
                #if(len(curr_weapon) > 1):
                    #dont use Weapon 1 since it is unknown and wouldnt be as useful to the user
                #    if(curr_weapon[0].Weapon == 1):
                #        to_use = curr_weapon[1].Weapon
                #district_markers_max_weapon[x] = weapon_names[to_use - 1] #weapon_names[max_weapon_id - 1]
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
    
    
    #list of 2 indecies. First element crime ([lat,long,intensity]) for each crime (2-d list). Second element number of crimes per district to display ([N,E,S,W,NE,NW,SE,SW,C])
    test_list = []
    test_list.append(crime_list)
    test_list.append(district_markers_test)
    test_list.append(district_markers_max_weapon)
    test_list.append(district_markers_max_crimecode)
    #print(test_list[2])
    #print(test_list[3])
    #return list with fist index for heatmap location data, second index for district marker count
    return test_list


###############################################################################################################################

####update for when user changes a startdate, end date and or location for covid data##########
# @app.route('/update', methods = ['GET', 'POST'])
# def update():

#     if request.method == 'POST':
#         my_data = covidcase.query.get(request.form.get('DayNum')) #may not need this line

#         my_data.DayNum = request.form['DayNum']
#         my_data.student_name = request.form['DATE']
#         my_data.credits_earned = request.form['DATE']

#         db.session.commit()

#         return redirect(url_for('index'))
        
if __name__ == "__main__":
    app.run(debug=True)