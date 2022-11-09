from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:PASSWORD@localhost:3306/DATABASENAME'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class crimecode(db.Model):
 
    CODE = db.Column(db.String(10), primary_key=True)
    CrimeName = db.Column(db.String(255))

    def __init__(self, CODE, CrimeName):
        self.CODE = CODE
        self.CrimeName = CrimeName
        
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
        
        
class crimedata(db.Model):

    RowId = db.Column(db.Integer, primary_key=True)
    DayNum = db.Column(db.Integer)
    CrimeDateTime = db.Column(db.String(255))
    CrimeCode = db.Column(db.string(10))
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