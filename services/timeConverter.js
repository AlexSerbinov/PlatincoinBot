// let unix_timestamp = 1549312452
// // Create a new JavaScript Date object based on the timestamp
// // multiplied by 1000 so that the argument is in milliseconds, not seconds.
// var date = new Date(unix_timestamp * 1000);
// // Hours part from the timestamp
// var hours = date.getHours();
// // Minutes part from the timestamp
// var minutes = "0" + date.getMinutes();
// // Seconds part from the timestamp
// var seconds = "0" + date.getSeconds();

// // Will display time in 10:30:23 format
// var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

// console.log(formattedTime);


// function timeConverter(UNIX_timestamp){
//     var a = new Date(UNIX_timestamp * 1000);
//     var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//     var year = a.getFullYear();
//     var month = months[a.getMonth()];
//     var date = a.getDate();
//     var hour = a.getHours();
//     var min = a.getMinutes();
//     var sec = a.getSeconds();
//     var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
//     return time;
//   }
//   console.log(timeConverter(1549312452));

//   var s = new Date(1549312452).toLocaleDateString("UTC")
// console.log(s)

// var s = new Date(1549312452).toLocaleTimeString("en-US")
// console.log(s)


// var x = new Date();
// var currentTimeZoneOffsetInHours = x.getTimezoneOffset() / 60;
// console.log(currentTimeZoneOffsetInHours)


const unixTimestamp = 1575909015



// const humanDateFormat = dateObject.toLocaleString() //2019-12-9 10:30:15

// dateObject.toLocaleString("en-US", {weekday: "long"}) // Monday
// dateObject.toLocaleString("en-US", {month: "long"}) // December
// dateObject.toLocaleString("en-US", {day: "numeric"}) // 9
// dateObject.toLocaleString("en-US", {year: "numeric"}) // 2019
// // console.log(dateObject.toLocaleString("en-US", {hour: "numeric"})) // 10 AM
// dateObject.toLocaleString("en-US", {minute: "numeric"}) // 30
// dateObject.toLocaleString("en-US", {second: "numeric"}) // 15



const humanDate = (timestamp) => {
    // const timestamp = Date.now()  // 1575909015000
    const dateObject = new Date(timestamp)
    // console.log(dateObject.toLocaleString("UTC", {timeZoneName: "short"})) // 12/9/2019, 10:30:15 AM CST
    return(dateObject.toLocaleString("UTC", {timeZoneName: "short"})) // 12/9/2019, 10:30:15 AM CST
}
module.exports = {humanDate}
