## Technology : 

### Frontend : 
- React Js (vite)
- Tailwind CSS

#### Library : 
- react-router

### Database : 
- Postgres

### Backend :
- Node Js
- Express Js

## Users :
- Donor
- Patient 
- Hospital/blood bank
- Admin -> view all users and blood requests

## Features : 
### about user authentication : 
- User Registration & Login (Donor/Hospital)
- Profile

### about donor
- Search Blood Donors (List View)
- Real time donor match
- Donor Eligibility Calculator
- Donation History & Logs

### about status
- Blood Bank Inventory Status
- Availablility of Donor status 

### about patient
- request for blood.
- fill Blood Form 

### notification
- Instatnt notification to all user 

### for event section
- Upcoming Blood Drive/Camp Events

### other
- Hospital/Blood Bank Directory
- Contact Us & Support

### AI feature
- AI generates polite emergency messages to donors automatically.

### Optional
- OTP while login
- Forgot password


## Flow :
need blood (patient) -> (Patient) request to Admin and fill the form -> Admin search the blood from hospital data (notify them) -> (Admin) if found : give to patient (notification to patient : found it!), else : contact donor, (notification to patient : donor found !) and (notification to donor : come to hospital, and donate blood)


## Sign Up info needed to take from user role wise : 

### Patient : 
- Full Name
- Email
- Phone Number ( First digit must be 6, 7, 8, or 9)
- Password
- City / Area

### Donor :
- Full Name
- Email
- Phone Number (( First digit must be 6, 7, 8, or 9))
- Password
- Blood Group
- City / Area
- Age
- Last Blood Donation Date (optional)
- Availability Status (default: Available) (Toggle button : Available / Not Available)

### Admin : 
- Admin Name
- Email
- Password

### Hospital / Blood bank :
- Hospital / Blood Bank Name
- Email
- Phone Number (First digit must be 6, 7, 8, or 9)
- Password
- City / Area
- Registration ID (optional)
- Contact Person Name

## Login details for all : 
- Role
- Email
- Password

