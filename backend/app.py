from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
import pymysql
pymysql.install_as_MySQLdb()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:1234@localhost:3306/447_groupproj'
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
    DATE = db.Column(db.String(255))
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

#creates crimedata table       
#creates Crime table      

class Crime(db.Model):
    RowId = db.Column(db.Integer, primary_key=True)
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


######initial route for display all data. i.e graphs heatmap etc.###############        
@app.route('/', methods=['GET'])
def index():
    all_covid = covidcase.query.all()
    #query = covid_schema.dump(all_covid)
    #all_crime = crimedata.query.all()

    #testing
    rollingavg = []
    #for x in all_covid:
    i = 0
    while i < len(all_covid): 
        dict = {"x": all_covid[i].DATE, "y": all_covid[i].AVGIncrease}
        #dict = {"x": i, "y": all_covid[i].AVGIncrease}
        rollingavg.append(dict)
        i+=1

    return jsonify(rollingavg)
    #return jsonify(query)
    
    
#Line graph for covid 1-week average
@app.route('/covidlinegraph', methods=['GET'])
def dateslist():

    #user's input from frontend filter
    sdate = str(request.args.get("startdate"))
    edate = (request.args.get("enddate"))

    all_covid = covidcase.query.all()
    #query = covid_schema.dump(all_covid)


    #converting user input from html calendar to DATETIME format to match query
    sdate = sdate.replace("-", "/")
    sdate += " 10:00:00+00"
    edate = edate.replace("-", "/")
    edate += " 10:00:00+00"

    startd = covidcase.query.filter_by(DATE = sdate).first()
    endd = covidcase.query.filter_by(DATE = edate).first()

    #print("test!", sdate , " " , startd.DayNum , " " , endd.DayNum)

    startDayNum = int(startd.DayNum)
    endDayNum = int(endd.DayNum)


    rollingavg = []
    
    i = startDayNum
    while i <= endDayNum:
        #adds dictionaries to the list, for x and y coordinate of each point on the graph (x as DATETIME format)
        dict = {"x": (all_covid[i-1].DATE)[0:10], "y": all_covid[i-1].AVGIncrease}

        #adds dictionaries to the list, for x and y coordinate of each point on the graph (x as DayNum int format)
        #dict = {"x": i, "y": all_covid[i].AVGIncrease}
        rollingavg.append(dict)
        i+=1

    #returning value will override the coviddata variable (in App.js) to update the graph
    return jsonify(rollingavg)
    

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