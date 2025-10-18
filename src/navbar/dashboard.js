import React, { useEffect, useState } from 'react';
import Sidebar from "../navbar/sidebar";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [postData, setPostData] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [yearbookCount, setYearbookCount] = useState(0);
  const [prevPostCount, setPrevPostCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://server-1-gjvd.onrender.com/yearbooks/count')
      .then(response => response.json())
      .then(data => setYearbookCount(data.count))
      .catch(error => console.error('Error fetching yearbook count:', error));
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/session", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          navigate(data.user.role === "admin" ? "/dashboard" : "/userhome");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    fetch('https://server-1-gjvd.onrender.com/api/users')
      .then(response => response.json())
      .then(data => {
        const monthlyData = Array(12).fill(0);
        setUserCount(data.length);

        data.forEach(user => {
          const month = new Date(user.created_at).getMonth();
          monthlyData[month] += 1;
        });

        const formattedData = monthlyData.map((count, index) => ({
          month: new Date(0, index).toLocaleString('en-US', { month: 'short' }),
          count,
        }));
        setData(formattedData);
      })
      .catch(error => console.error('Error fetching alumni data:', error));
  }, []);

  useEffect(() => {
    fetch('https://server-1-gjvd.onrender.com/api/posts')
      .then(response => response.json())
      .then(posts => {
        setPrevPostCount(postCount);
        const postCountByDate = {};
        setPostCount(posts.length);

        posts.forEach(post => {
          const date = new Date(post.date_posted).toLocaleDateString('en-US');
          postCountByDate[date] = (postCountByDate[date] || 0) + 1;
        });

        const totalPosts = Object.values(postCountByDate).reduce((sum, count) => sum + count, 0);

        const chartData = Object.keys(postCountByDate).map(date => ({
          date,
          percentage: ((postCountByDate[date] / totalPosts) * 100).toFixed(2)
        }));
        setPostData(chartData);
      })
      .catch(error => console.error('Error fetching posts data:', error));
  }, [postCount]);

  const renderArrow = () => {
    if (postCount > prevPostCount) {
      return <ArrowUpCircleIcon className="h-6 w-6 text-green-500 inline-block ml-2" />;
    } else if (postCount < prevPostCount) {
      return <ArrowDownCircleIcon className="h-6 w-6 text-red-500 inline-block ml-2" />;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-64 bg-gray-50">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[{ title: 'Total Users', count: userCount }, { title: 'Total Posts', count: postCount, arrow: true }, { title: 'Total Yearbooks', count: yearbookCount }].map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
              <h3 className="text-xl font-semibold text-gray-700">{item.title}</h3>
              <p className="text-4xl font-bold text-blue-500">{item.count}
                {item.arrow && renderArrow()}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-8">
          {/* User Registration Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">User Registrations by Month</h2>
            {data.length === 0 ? (
              <p className="text-gray-500">No data available or loading...</p>
            ) : (
              <LineChart width={400} height={300} data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4287f5" />
              </LineChart>
            )}
          </div>

          {/* Posts Percentage Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Posts Percentage by Date</h2>
            {postData.length === 0 ? (
              <p className="text-gray-500">No data available or loading...</p>
            ) : (
              <AreaChart width={400} height={300} data={postData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="percentage" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
