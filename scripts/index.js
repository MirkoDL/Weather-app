class Hour {
  constructor(array) {
    this.date = array[0].split("T")[0];
    this.time = array[0].split("T")[1];
    this.temperature = Math.floor(array[1]);
    this.humidity = array[2];
    this.rainProbability = array[3];
    this.weatherCode = array[4];
    this.windSpeed = array[5];
  }
}

class Day {
  constructor(array) {
    this.date = array[0].date;
    this.hoursArray = Object.values(array);
  }

  maxTemp() {
    let max = this.hoursArray.reduce((acc, curr) => {
      return Math.max(acc, curr.temperature);
    }, -Infinity);
    return Math.floor(max);
  }

  minTemp() {
    let min = this.hoursArray.reduce((acc, curr) => {
      return Math.min(acc, curr.temperature);
    }, Infinity);
    return Math.floor(min);
  }

  avgTemp() {
    let total = this.hoursArray.reduce((acc, curr) => {
      return acc + curr.temperature;
    }, 0);
    return Math.floor(total / this.hoursArray.length);
  }

  avgRainProbability() {
    let total = this.hoursArray.reduce((acc, curr) => {
      return acc + curr.rainProbability;
    }, 0);
    return Math.floor(total / this.hoursArray.length);
  }
  avgHumidity() {
    let total = this.hoursArray.reduce((acc, curr) => {
      return acc + curr.humidity;
    }, 0);
    return Math.floor(total / this.hoursArray.length);
  }
  avgWeather() {
    let avgRainProbability = this.avgRainProbability();
    let avgHumidity = this.avgHumidity();
    if (avgRainProbability >= 50) {
      //rain
      return 61;
    } else if (avgRainProbability < 50 && avgHumidity >= 70) {
      //cloudy
      return 45;
    } else {
      //sunny
      return 1;
    }
  }
}

async function getLocation() {
  let lat = "";
  let long = "";

  async function getApproximateLocation() {
    return new Promise(async (resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async function (position) {
            lat = position.coords.latitude.toFixed(2);
            long = position.coords.longitude.toFixed(2);

            // You can use lat and long for approximate purposes.
            resolve();
          },
          async function (error) {
            console.log(
              "An error occurred while accessing approximate location:",
              error,
            );

            // Try to get approximate location based on client's country using ipinfo.io
            try {
              const response = await fetch("https://ipinfo.io/json");
              const data = await response.json();
              const [capitalLat, capitalLong] = data.loc.split(",");
              lat = capitalLat;
              long = capitalLong;
              resolve();
            } catch (err) {
              console.error("Error while fetching approximate location:", err);
              reject(err);
            }
          },
          { maximumAge: 60000 },
        );
      } else {
        console.log("Your browser does not support approximate geolocation.");
        // Try to get approximate location based on client's country using ipinfo.io
        try {
          const response = await fetch("https://ipinfo.io/json");
          const data = await response.json();
          const [capitalLat, capitalLong] = data.loc.split(",");
          lat = capitalLat;
          long = capitalLong;
          resolve();
        } catch (err) {
          console.error("Error while fetching approximate location:", err);
          reject("Geolocation not supported");
        }
      }
    });
  }

  await getApproximateLocation();

  let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.display_name) {
      let city = data.display_name;
      return [lat, long, city];
    } else if (data.address) {
      let city = data.address.municipality;
      return [lat, long, city];
    } else {
      console.log("Location name not available in the data.", lat, long);
      return [lat, long, ""];
    }
  } catch (error) {
    console.error(
      "An error occurred while making the reverse geolocation request:",
      error,
    );
    return [lat, long, ""];
  }
}

// Use the getLocation() function in an asynchronous context
(async () => {
  const [latitude, longitude, city] = await getLocation();
})();

async function getData(lat = "", long = "", city = "") {
  if (lat === "") {
    [lat, long, city] = await getLocation();
  }
  let data = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m&current_weather=true`,
  )
    .then((response) => response.json())
    .catch((error) => console.log("error", error));
  return [data.hourly, city];
  // Use await to get the location data
}

function weatherName(weatherCode) {
  switch (weatherCode) {
    case 0:
    case 1:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"/></svg>';
    case 2:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 640 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M294.2 1.2c5.1 2.1 8.7 6.7 9.6 12.1l14.1 84.7 84.7 14.1c5.4 .9 10 4.5 12.1 9.6s1.5 10.9-1.6 15.4l-38.5 55c-2.2-.1-4.4-.2-6.7-.2c-23.3 0-45.1 6.2-64 17.1l0-1.1c0-53-43-96-96-96s-96 43-96 96s43 96 96 96c8.1 0 15.9-1 23.4-2.9c-36.6 18.1-63.3 53.1-69.8 94.9l-24.4 17c-4.5 3.2-10.3 3.8-15.4 1.6s-8.7-6.7-9.6-12.1L98.1 317.9 13.4 303.8c-5.4-.9-10-4.5-12.1-9.6s-1.5-10.9 1.6-15.4L52.5 208 2.9 137.2c-3.2-4.5-3.8-10.3-1.6-15.4s6.7-8.7 12.1-9.6L98.1 98.1l14.1-84.7c.9-5.4 4.5-10 9.6-12.1s10.9-1.5 15.4 1.6L208 52.5 278.8 2.9c4.5-3.2 10.3-3.8 15.4-1.6zM144 208a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM639.9 431.9c0 44.2-35.8 80-80 80H288c-53 0-96-43-96-96c0-47.6 34.6-87 80-94.6l0-1.3c0-53 43-96 96-96c34.9 0 65.4 18.6 82.2 46.4c13-9.1 28.8-14.4 45.8-14.4c44.2 0 80 35.8 80 80c0 5.9-.6 11.7-1.9 17.2c37.4 6.7 65.8 39.4 65.8 78.7z"/></svg>';
    case 3:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 640 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M0 336c0 79.5 64.5 144 144 144H512c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z"/></svg>';
    case 45:
    case 48:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 640 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M32 144c0 79.5 64.5 144 144 144H299.3c22.6 19.9 52.2 32 84.7 32s62.1-12.1 84.7-32H496c61.9 0 112-50.1 112-112s-50.1-112-112-112c-10.7 0-21 1.5-30.8 4.3C443.8 27.7 401.1 0 352 0c-32.6 0-62.4 12.2-85.1 32.3C242.1 12.1 210.5 0 176 0C96.5 0 32 64.5 32 144zM616 368H280c-13.3 0-24 10.7-24 24s10.7 24 24 24H616c13.3 0 24-10.7 24-24s-10.7-24-24-24zm-64 96H440c-13.3 0-24 10.7-24 24s10.7 24 24 24H552c13.3 0 24-10.7 24-24s-10.7-24-24-24zm-192 0H24c-13.3 0-24 10.7-24 24s10.7 24 24 24H360c13.3 0 24-10.7 24-24s-10.7-24-24-24zM224 392c0-13.3-10.7-24-24-24H96c-13.3 0-24 10.7-24 24s10.7 24 24 24H200c13.3 0 24-10.7 24-24z"/></svg>';
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M96 320c-53 0-96-43-96-96c0-42.5 27.6-78.6 65.9-91.2C64.7 126.1 64 119.1 64 112C64 50.1 114.1 0 176 0c43.1 0 80.5 24.3 99.2 60c14.7-17.1 36.5-28 60.8-28c44.2 0 80 35.8 80 80c0 5.5-.6 10.8-1.6 16c.5 0 1.1 0 1.6 0c53 0 96 43 96 96s-43 96-96 96H96zm-6.8 52c1.3-2.5 3.9-4 6.8-4s5.4 1.5 6.8 4l35.1 64.6c4.1 7.5 6.2 15.8 6.2 24.3v3c0 26.5-21.5 48-48 48s-48-21.5-48-48v-3c0-8.5 2.1-16.9 6.2-24.3L89.2 372zm160 0c1.3-2.5 3.9-4 6.8-4s5.4 1.5 6.8 4l35.1 64.6c4.1 7.5 6.2 15.8 6.2 24.3v3c0 26.5-21.5 48-48 48s-48-21.5-48-48v-3c0-8.5 2.1-16.9 6.2-24.3L249.2 372zm124.9 64.6L409.2 372c1.3-2.5 3.9-4 6.8-4s5.4 1.5 6.8 4l35.1 64.6c4.1 7.5 6.2 15.8 6.2 24.3v3c0 26.5-21.5 48-48 48s-48-21.5-48-48v-3c0-8.5 2.1-16.9 6.2-24.3z"/></svg>';
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M96 320c-53 0-96-43-96-96c0-42.5 27.6-78.6 65.9-91.2C64.7 126.1 64 119.1 64 112C64 50.1 114.1 0 176 0c43.1 0 80.5 24.3 99.2 60c14.7-17.1 36.5-28 60.8-28c44.2 0 80 35.8 80 80c0 5.5-.6 10.8-1.6 16c.5 0 1.1 0 1.6 0c53 0 96 43 96 96s-43 96-96 96H96zM81.5 353.9c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6S-3.3 490.7 1.9 478.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6zm120 0c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6zm244.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6s17.8 19.3 12.6 31.5zM313.5 353.9c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6z"/></svg>';
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224 0c17.7 0 32 14.3 32 32V62.1l15-15c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-49 49v70.3l61.4-35.8 17.7-66.1c3.4-12.8 16.6-20.4 29.4-17s20.4 16.6 17 29.4l-5.2 19.3 23.6-13.8c15.3-8.9 34.9-3.7 43.8 11.5s3.8 34.9-11.5 43.8l-25.3 14.8 21.7 5.8c12.8 3.4 20.4 16.6 17 29.4s-16.6 20.4-29.4 17l-67.7-18.1L287.5 256l60.9 35.5 67.7-18.1c12.8-3.4 26 4.2 29.4 17s-4.2 26-17 29.4l-21.7 5.8 25.3 14.8c15.3 8.9 20.4 28.5 11.5 43.8s-28.5 20.4-43.8 11.5l-23.6-13.8 5.2 19.3c3.4 12.8-4.2 26-17 29.4s-26-4.2-29.4-17l-17.7-66.1L256 311.7v70.3l49 49c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-15-15V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V449.9l-15 15c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l49-49V311.7l-61.4 35.8-17.7 66.1c-3.4 12.8-16.6 20.4-29.4 17s-20.4-16.6-17-29.4l5.2-19.3L48.1 395.6c-15.3 8.9-34.9 3.7-43.8-11.5s-3.7-34.9 11.5-43.8l25.3-14.8-21.7-5.8c-12.8-3.4-20.4-16.6-17-29.4s16.6-20.4 29.4-17l67.7 18.1L160.5 256 99.6 220.5 31.9 238.6c-12.8 3.4-26-4.2-29.4-17s4.2-26 17-29.4l21.7-5.8L15.9 171.6C.6 162.7-4.5 143.1 4.4 127.9s28.5-20.4 43.8-11.5l23.6 13.8-5.2-19.3c-3.4-12.8 4.2-26 17-29.4s26 4.2 29.4 17l17.7 66.1L192 200.3V129.9L143 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l15 15V32c0-17.7 14.3-32 32-32z"/></svg>';
    case 80:
    case 81:
    case 82:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M96 320c-53 0-96-43-96-96c0-42.5 27.6-78.6 65.9-91.2C64.7 126.1 64 119.1 64 112C64 50.1 114.1 0 176 0c43.1 0 80.5 24.3 99.2 60c14.7-17.1 36.5-28 60.8-28c44.2 0 80 35.8 80 80c0 5.5-.6 10.8-1.6 16c.5 0 1.1 0 1.6 0c53 0 96 43 96 96s-43 96-96 96H96zM81.5 353.9c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6S-3.3 490.7 1.9 478.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6zm120 0c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6zm244.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6s17.8 19.3 12.6 31.5zM313.5 353.9c12.2 5.2 17.8 19.3 12.6 31.5l-48 112c-5.2 12.2-19.3 17.8-31.5 12.6s-17.8-19.3-12.6-31.5l48-112c5.2-12.2 19.3-17.8 31.5-12.6z"/></svg>';
    case 95:
    case 96:
    case 99:
      return '<svg xmlns="http://www.w3.org/2000/svg" height="8vw" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M0 224c0 53 43 96 96 96h47.2L290 202.5c17.6-14.1 42.6-14 60.2 .2s22.8 38.6 12.8 58.8L333.7 320H352h64c53 0 96-43 96-96s-43-96-96-96c-.5 0-1.1 0-1.6 0c1.1-5.2 1.6-10.5 1.6-16c0-44.2-35.8-80-80-80c-24.3 0-46.1 10.9-60.8 28C256.5 24.3 219.1 0 176 0C114.1 0 64 50.1 64 112c0 7.1 .7 14.1 1.9 20.8C27.6 145.4 0 181.5 0 224zm330.1 3.6c-5.8-4.7-14.2-4.7-20.1-.1l-160 128c-5.3 4.2-7.4 11.4-5.1 17.8s8.3 10.7 15.1 10.7h70.1L177.7 488.8c-3.4 6.7-1.6 14.9 4.3 19.6s14.2 4.7 20.1 .1l160-128c5.3-4.2 7.4-11.4 5.1-17.8s-8.3-10.7-15.1-10.7H281.9l52.4-104.8c3.4-6.7 1.6-14.9-4.2-19.6z"/></svg>';
    default:
      return ""; // Testo di default se il numero non corrisponde a nessun caso
  }
}

function formattaData(data) {
  const lingua = navigator.language;
  const opzioniData = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  return new Intl.DateTimeFormat(lingua, opzioniData).format(new Date(data));
}

function updateDom(days, city, displayDay = 0) {
  //console.log(days);
  const locationName = document.getElementById("location");
  const locationInput = locationName.querySelector("input");
  const todayExtended = document.getElementById("today");
  const todayH6 = todayExtended.querySelector("h6");
  locationInput.value = city;
  const formattedDate = formattaData(days[displayDay].date);
  todayH6.innerHTML = formattedDate;

  const currentHour = new Date().getHours();
  const forecast = document.getElementById("forecast");
  const forecastH1 = forecast.querySelector("h1");
  forecastH1.innerHTML =
    days[displayDay].hoursArray[currentHour].temperature + "°";
  const humidity = document.querySelector("#humidity");
  humidity.innerHTML = days[displayDay].hoursArray[currentHour].humidity + "%";
  const rainProbability = document.querySelector("#precipitation");
  rainProbability.innerHTML =
    days[displayDay].hoursArray[currentHour].rainProbability + "%";
  const windSpeed = document.querySelector("#windSpeed");
  windSpeed.innerHTML =
    days[displayDay].hoursArray[currentHour].windSpeed + "km/h";
  const weatherCode = days[displayDay].hoursArray[currentHour].weatherCode;
  let weatherIcon = weatherName(weatherCode);
  document.querySelector("#weatherIcon").innerHTML = weatherIcon;
  const comingForecast = document.querySelector("#comingForecast");
  comingForecast.innerHTML = "";
  const nextDays = days.slice(1);
  let iterator = 1;
  nextDays.forEach((day) => {
    let maxTemp = day.maxTemp();
    let minTemp = day.minTemp();
    let avgWeather = day.avgWeather();
    let weatherIcon = () => {
      if (avgWeather === 45) {
        return "fa-solid fa-cloud";
      } else if (avgWeather === 61) {
        return "fa-solid fa-cloud-rain";
      } else {
        return "fa-solid fa-sun";
      }
    };
    const date = new Date(day.date);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[date.getDay()];
    const div = document.createElement("div");
    div.className = "col m-1 text-center col-auto standardDiv";
    const pDay = document.createElement("p");
    pDay.id = iterator;
    iterator++;
    pDay.className = "mainColor fw-bold mt-3";
    pDay.textContent = dayName.toUpperCase() + " " + day.date.substring(8);
    const icon = document.createElement("i");
    icon.className = `${weatherIcon()} fa-xl`;
    icon.style.color = "#5759e7";
    const pMaxTemp = document.createElement("p");
    pMaxTemp.className = "mainColor fw-bold mt-3";
    pMaxTemp.textContent = maxTemp + "°";
    const pMinTemp = document.createElement("p");
    pMinTemp.className = "mainColor fw-light";
    pMinTemp.textContent = minTemp + "°";
    div.appendChild(pDay);
    div.appendChild(icon);
    div.appendChild(pMaxTemp);
    div.appendChild(pMinTemp);

    comingForecast.appendChild(div);
  });
  lineCoords(days[displayDay].hoursArray);
}

function setup() {
  const body = document.querySelector("body");
  body.style.filter = "none";
  const elem = document.getElementById("statistics");
  if (elem) {
    const width = elem.offsetWidth;
    const height = elem.offsetHeight;
    const bodyWidth = document.body.offsetWidth;
    let canvas = createCanvas(
      bodyWidth > 992 ? width * 2 : width,
      bodyWidth > 992 ? height : height / 2,
    );
    console.log(width, width > 900 ? width * 2 : width);
    canvas.parent("canvas-container");
    translate(0, width > 200 ? height / 2 : height / 4); // Trasforma l'origine nell'angolo in basso a sinistra
    scale(1, -1); // Inverti l'asse Y
  } else {
    console.log("waiting DOM...");
  }
}
function draw() {
  clear();
  if (coordArray.length > 0) {
    const width = document.getElementById("canvas-container").offsetWidth;
    let height = document.getElementById("canvas-container").offsetHeight;
    translate(0, height);
    scale(1, -1);
    iteration = width / 12;
    const maxVal = height * 0.7;
    // Calcola il fattore di scala in base al valore massimo
    const scaleFactor = maxVal / Math.max(...coordArray.map((item) => item[0]));
    // Applica il fattore di scala a ciascun elemento nella prima posizione e arrotonda a 0 decimali
    coordArray.forEach((item) => {
      item[0] = Math.round(item[0] * scaleFactor);
    });
    noFill();
    stroke(255);

    beginShape();
    let x = 0;
    const textSizeFactor = width * 0.06; // Puoi regolare questo fattore a tuo piacimento
    const textSizeValue = Math.min(textSizeFactor, 15); // Imposta un valore massimo di 20 per la dimensione del testo
    coordArray.forEach((e) => {
      vertex(x, e[0]);
      push();
      translate(x, e[0]);
      scale(1, -1); // Trasforma il testo per correggere l'orientamento
      textSize(textSizeValue); // Imposta la dimensione del testo a 12 pixel
      noStroke();
      fill(255, 255, 255);
      text(
        `${e[2].match(/(\d+):(\d+)/)[1]} ${
          e[1] == 1 ? "\n☀️" : e[1] == 45 ? "\n☁️" : "\n🌧"
        }`,
        0,
        -5,
      );
      pop();
      x += iteration;
    });
    vertex(x, coordArray[coordArray.length - 1][0]);
    endShape();
  } else {
    console.log("EMPTY");
  }
}

async function getCityCoordinates(cityName) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${cityName}`,
    );
    const data = await response.json();

    if (data.length > 0) {
      const location = data[0];
      const lat = parseFloat(location.lat);
      const long = parseFloat(location.lon);
      const city = location.display_name;
      return { lat, long, city }; // Restituisco un oggetto con lat e long
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

let coordArray = [];
function lineCoords(arr) {
  const array = arr.filter((element, index) => index % 2 === 0);
  //console.log(array);
  coordArray = array.map((e) => {
    let weather;
    if (e.rainProbability >= 50) {
      //rain
      weather = 61;
    } else if (e.rainProbability < 50 && e.humidity >= 70) {
      //cloudy
      weather = 45;
    } else {
      //sunny
      weather = 1;
    }
    return [e.temperature * 5, weather, e.time];
  });
  return coordArray;
}

function hideKeyboard(element) {
  element.setAttribute("readonly", "readonly"); // Force keyboard to hide on input field.
  element.setAttribute("disabled", "true"); // Force keyboard to hide on textarea field.
  setTimeout(function () {
    element.blur(); //actually close the keyboard
    // Remove readonly attribute after keyboard is hidden.
    element.removeAttribute("readonly");
    element.removeAttribute("disabled");
  }, 100);
}

(async function main(data = "", city = "") {
  if (data === "") {
    [data, city] = await getData();
  }
  const hours = [];
  const days = [];
  let j = 0;
  const keys = Object.keys(data);

  while (j < data[keys[0]].length) {
    let temp = [];
    for (let i = 0; i < keys.length; i++) {
      temp.push(data[keys[i]][j]);
    }
    hours.push(new Hour(temp));
    j++;
  }

  while (hours.length > 0) {
    let temp = [];
    for (let i = 0; i < 24; i++) {
      temp.push(hours[i]);
    }
    days.push(new Day(temp));
    hours.splice(0, 24);
  }
  updateDom(days, city);

  const locationName = document.getElementById("location");
  const locationInput = locationName.querySelector("input");
  locationInput.onclick = function () {
    locationInput.select();
  };
  locationInput.addEventListener("keydown", async function (event) {
    if (event.key === "Enter") {
      console.log(document.getElementById("location").querySelector("input"));
      hideKeyboard(document.getElementById("location").querySelector("input"));
      let cityValue = locationInput.value;
      const coordinates = await getCityCoordinates(cityValue); // Ottengo le coordinate come oggetto
      if (coordinates) {
        // Città trovata
        locationInput.style.color = "#4e4fe1";
        const { lat, long, city } = coordinates; // Estraggo lat e long dall'oggetto

        const data = await getData(lat, long, city);

        main(data[0], city);
      } else {
        locationInput.style.color = "red";
      }
    }
  });
  // Seleziona tutti gli elementi <div> con ID "comingForecast"
  let container = document.getElementById("comingForecast");

  container.addEventListener("click", function (event) {
    event.stopPropagation();
    let clickedDiv = event.target.closest("div");
    if (clickedDiv) {
      let clickedP = clickedDiv.querySelector("p");
      if (clickedP) {
        let id = clickedP.id;
        updateDom(days, city, id);
        // Aggiungi la classe al div selezionato
        const elementoP = document.querySelector('p[id="' + id + '"]');
        clickedDiv = elementoP.closest("div");
        clickedDiv.classList.remove("standardDiv");
        clickedDiv.classList.add("selectedDiv");
      }
    }
  });

  document.getElementById("today").addEventListener("click", function (event) {
    event.stopPropagation();
    updateDom(days, city);
  });
})();
