// Sample dashboard data

let totalMembers = 120;
let upcomingEvents = 5;
let totalDonations = 3500;
let attendanceToday = 85;

document.getElementById("members").textContent = totalMembers;
document.getElementById("events").textContent = upcomingEvents;
document.getElementById("donations").textContent = "$" + totalDonations;
document.getElementById("attendance").textContent = attendanceToday;


// Simple welcome message
window.onload = function(){
    console.log("Church Management System Loaded Successfully");
}