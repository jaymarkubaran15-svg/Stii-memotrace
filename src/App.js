import React from 'react'
import { BrowserRouter as Router, Routes, Route  } from "react-router-dom";
import Front from './front';
import Register from "./register";
import Login from "./login";
import Home from "./navbar/home";
import Post from "./navbar/post";
import Dashboard from "./navbar/dashboard";
import AdminProfile from "./navbar/adminprofile";
import Courses from './navbar/courses';
import Users from './navbar/users';
import Survey from './navbar/survey';
import SurveyChart from './navbar/surveychart';
import AdminSearch from './navbar/searchresult';
import FormBuilder from './navbar/formbuilder';
import SurveyAdmin from './navbar/SurveyAdmin';
import Feedbackmgr from   './navbar/feedbackmgr';
import CreateAdminPost from './navbar/CreateAdminPost';
import AdminPost from './navbar/AdminPost';
import CareerPath from './navbar/CareerPath';
import UserCard from './navbar/UserCard';
// import CourseAlignment from './navbar/courseAlignment';


import About from './about';
import Contact from './contact';
import Forgotpassword from './forgotpassword';
import Services from './services';
import Project from './project';
import NavLink from './linkbar';
import Efeedback from './Efeedback';
import AlumniList from './alumnilist';


import UserNav from "./userNavbar/nav";
import Userhome from "./userNavbar/userhome";
import Userpost from "./userNavbar/userpost";
import Userevent from "./userNavbar/userevent";
import Userprofile from "./userNavbar/userprofile";
import SurveyQ from './userNavbar/surveyq';
import Notification from './userNavbar/notification';
import UserSearch from './userNavbar/usersearchresult';
import Profiles from './userNavbar/profiles';
import Dynamicform from './userNavbar/dynamicform';
import Gtsform from './userNavbar/GTSForm';
import EditProfile from './userNavbar/EditProfile';
import EditWork from './userNavbar/EditWork';
import EditEducation from './userNavbar/EditEducation';


import ChatApp from './userNavbar/ChatApp';
import CreatePost from './userNavbar/CreatePost';

import PostsPage from './userNavbar/postpage';
import Gallery from './userNavbar/Gallery';

// teporery
import EmployerSection from './userNavbar/EmployerSection';


export default function App() {

 
  return (
    <div>
       <Router>
      <Routes>
        <Route path="/" element={<Front />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />
        <Route path="/services" element={<Services />} />
        <Route path="/project" element={<Project />} />
        <Route path="/linkbar" element={<NavLink />} />
        <Route path="/Efeedback" element={<Efeedback />} />
        <Route path="/alumnilist" element={<AlumniList />} />
        <Route path="/CareerPath" element={<CareerPath />} />
        <Route path="/UserCard" element={<UserCard />} />


        <Route path="/searchresult" element={<AdminSearch />} />
        <Route path="/formbuilder" element={<FormBuilder />} />
        <Route path="/feedbackmgr" element={<Feedbackmgr />} />


        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/post" element={<Post />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/adminprofile" element={<AdminProfile />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/surveychart" element={<SurveyChart />} />
        

        <Route path="/nav" element={<UserNav />} />
        <Route path="/surveyq" element={<SurveyQ />} />
        <Route path="/userhome" element={<Userhome />} />
        <Route path="/userpost" element={<Userpost />} />
        <Route path="/userevent" element={<Userevent />} />
        <Route path="/userprofile" element={<Userprofile />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/usersearchresult" element={<UserSearch />} />
        <Route path="/profiles/:id" element={<Profiles/>} />
        <Route path="/dynamicform" element={<Dynamicform/>}/>
        <Route path="/gtsform" element={<Gtsform/>}/>
        <Route path="/SurveyAdmin" element={<SurveyAdmin/>}/>
        <Route path="/CreateAdminPost" element={<CreateAdminPost/>}/>
         <Route path="/AdminPost" element={<AdminPost/>}/>

        <Route path="/ChatApp" element={<ChatApp/>}/>
        <Route path="/CreatePost" element={<CreatePost/>}/>
      
        <Route path="/postpage" element={<PostsPage/>}/>
        <Route path="/Gallery" element={<Gallery/>}/>

{/* temporary */}
        <Route path="/EmployerSection" element={<EmployerSection/>}/>
         <Route path="/EditProfile" element={<EditProfile/>}/>
        <Route path="/EditWork" element={<EditWork/>}/>
        <Route path="/EditEducation" element={<EditEducation/>}/>
         {/* <Route path="/courseAlignment" element={<CourseAlignment/>}/> */}

      </Routes>
    </Router>
   
    </div>
    
  )
}
