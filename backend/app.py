from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import between
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

    def __init__(self, WeapongID, Weapons):
        self.WeaponID = WeapongID
        self.Weapons = Weapons

"""
def parse_geodata(GeoLocation):
    GeoLocation = GeoLocation.strip('()').split(',')
    GeoLocation = [float(x) for x in GeoLocation]
    return GeoLocation
"""
    
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



#Default view and Updates bar graph for criminal ages with user input from form 
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
    

    #queries crime in specified district between start and end date
    if(district != "Al"):
    
        #if specific distric and weapon
        if(weapon != "Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district), Crime.Weapon.like(weapon)).all()
    
        #if specific district but all weapon
        else:
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate), Crime.District.like(district)).all()


    #queries crime in ALL districts between start and end date
    else:
        #if all districts and choses specific weapon
        if(weapon !="Al"):
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.Weapon.like(weapon)).all()

        #if all district and all weapons
        else:   
            allcrime_timepd = Crime.query.filter(Crime.CrimeDate.between(sdate,edate)).all()

    #list holds dictionaries to be used as the bar graph's data 
    crime_ages = []

    #Increment appropriate age range
    i=0
    while i <= len(allcrime_timepd)-1:
        crime = allcrime_timepd[i]
        age = crime.Age

        if(age < 20 and age > 0):
            range_count[0] +=1
        
        elif(age >= 20 and age <= 25):
            range_count[1] +=1

        elif(age >= 26 and age <=35):
            range_count[2] +=1

        elif(age >= 36 and age <= 50):
            range_count[3] +=1

        elif(age >= 51 and age <=60):
            range_count[4] +=1

        elif(age >= 61 and age <= 69):
            range_count[5] +=1

        elif(age >= 70):
            range_count[6] +=1

        #NA age
        elif(age == 0): 
            range_count[7] +=1

        i+=1

    #create dictionary of list of counts per age range
    q = 0
    while q < len(range_count):
        dict = {"x":ranges[q], "y": range_count[q]}
        crime_ages.append(dict)

        q+=1

    #returning value will populate or override the crimeagebar variable (in App.js) to update the bar graph
    return crime_ages
    


@app.route('/heatmapmarkers', methods=['GET'])
def heatmapmarkers():

    sdate = str(request.args.get("startdateheat"))
    edate = str(request.args.get("enddateheat"))
    district = str(request.args.get("districtheat"))

    #format html calendar input into datetime to query matches
    sdate = datetime.strptime(sdate, '%Y-%m-%d')
    edate = datetime.strptime(edate, '%Y-%m-%d')

    #Queries all crime committed between two dates and a specific district given by user
    if(district != "Al"):
        crime_test = Crime.query.filter(Crime.CrimeDate.between(sdate,edate),Crime.District.like(district)).all()
    #Queries all crime committed between two dates given by user for ALL districts
    else:
        crime_test = Crime.query.filter(Crime.CrimeDate.between(sdate,edate)).all()


    #2-D list. Each row is a pair of latitude, logitude, and intensity of the marker
    crime_list = []

    q = 0
    while q <= len(crime_test)-1:   

        #has to be sent in format [Lat,Long,Intensity]     
        crime_list.append([crime_test[q].Latitude,crime_test[q].Longitude,"0.00001"])
        q+=1
    
    return crime_list


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