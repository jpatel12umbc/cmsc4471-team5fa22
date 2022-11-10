from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
#import pymysql
#pymysql.install_as_MySQLdb()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:PASSWORD@localhost:3306/DATABASENAME'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

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
        

#creates crimedata table       
class crimedata(db.Model):

    RowId = db.Column(db.Integer, primary_key=True)
    DayNum = db.Column(db.Integer)
    CrimeDateTime = db.Column(db.String(255))
    CrimeCode = db.Column(db.String(10))
    Weapon = db.Column(db.String(255))
    Gender = db.Column(db.String(10))
    Age = db.Column(db.Integer)
    District = db.Column(db.String(10))
    GeoLocation = db.Column(db.String(255))
    
    def __init__(self, RowID, DayNum, CrimeDateTime, CrimeCode, Weapon, Gender, Age, District, GeoLocation):
        self.RowID = RowID
        self.DayNum = DayNum
        self.CrimeDateTime = CrimeDateTime
        self.CrimeCode = CrimeCode
        self.Weapon = Weapon
        self.Gender = Gender
        self.Age = Age
        self.District = District
        self.GeoLocation = GeoLocation

def parse_geodata(GeoLocation):
    GeoLocation = GeoLocation.strip('()').split(',')
    GeoLocation = [float(x) for x in GeoLocation]
    return GeoLocation

######initial route for display all data. i.e graphs heatmap etc.###############        
@app.route('/')
def index():
    all_covid = covidcase.query.all()
    all_crime = crimedata.query.all()
    return render_template()


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