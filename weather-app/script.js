const cityButtonsDiv = document.getElementById("cityButtons");
const weatherContainer = document.getElementById("weatherContainer");
const statusText = document.getElementById("status");

const addCityToggle = document.getElementById("addCityToggle");
const addCitySection = document.getElementById("addCitySection");
const cityInput = document.getElementById("cityInput");
const suggestionsDiv = document.getElementById("suggestions");
const cityError = document.getElementById("cityError");
const addCityBtn = document.getElementById("addCityBtn");
const refreshBtn = document.getElementById("refreshBtn");


const allCities = [
    { name: "Москва", lat: 55.75, lon: 37.61 },
    { name: "Санкт-Петербург", lat: 59.93, lon: 30.31 },
    { name: "Казань", lat: 55.79, lon: 49.12 },
    { name: "Новосибирск", lat: 55.03, lon: 82.92 },
    { name: "Екатеринбург", lat: 56.84, lon: 60.61 }
];

let cities = JSON.parse(localStorage.getItem("cities")) || [
    allCities[0],
    allCities[1]
];

let userLocation = JSON.parse(localStorage.getItem("userLocation"));
let activeCity = null;


function save() {
    localStorage.setItem("cities", JSON.stringify(cities));
    localStorage.setItem("userLocation", JSON.stringify(userLocation));
}


function requestGeo() {
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLocation = {
                name: "Текущее местоположение",
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            };
            save();
            setActiveCity(userLocation);
        },
        () => {
            
        }
    );
}


function renderCityButtons() {
    cityButtonsDiv.innerHTML = "";

    if (userLocation) createCityButton(userLocation);
    cities.forEach(city => createCityButton(city));
}

function createCityButton(city) {
    const btn = document.createElement("button");
    btn.textContent = city.name;

    if (activeCity && activeCity.name === city.name) {
        btn.classList.add("active");
    }

    btn.onclick = () => setActiveCity(city);
    cityButtonsDiv.appendChild(btn);
}

function setActiveCity(city) {
    activeCity = city;
    renderCityButtons();
    loadWeather(city);
}


function loadWeather(city) {
    weatherContainer.innerHTML = "";
    statusText.textContent = "Загрузка...";

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto`)
        .then(r => r.json())
        .then(data => {
            statusText.textContent = "";
            renderWeather(city.name, data);
        })
        .catch(() => {
            statusText.textContent = "Ошибка загрузки погоды";
        });
}

function renderWeather(name, data) {
    const days = data.daily.time;

    weatherContainer.innerHTML = `
        <div class="current-weather">
            <h2>${name}</h2>
            <div class="current-temp">${data.current_weather.temperature}°C</div>
            <p>Ветер: ${data.current_weather.windspeed} м/с</p>
            <p>Макс/Мин: ${data.daily.temperature_2m_max[0]}°C / ${data.daily.temperature_2m_min[0]}°C</p>
        </div>

        <div class="forecast-table">
            <table>
                <tr>
                    <th></th>
                    <th>${days[0]}</th>
                    <th>${days[1]}</th>
                    <th>${days[2]}</th>
                </tr>
                <tr>
                    <td>Макс °C</td>
                    <td>${data.daily.temperature_2m_max[0]}</td>
                    <td>${data.daily.temperature_2m_max[1]}</td>
                    <td>${data.daily.temperature_2m_max[2]}</td>
                </tr>
                <tr>
                    <td>Мин °C</td>
                    <td>${data.daily.temperature_2m_min[0]}</td>
                    <td>${data.daily.temperature_2m_min[1]}</td>
                    <td>${data.daily.temperature_2m_min[2]}</td>
                </tr>
                <tr>
                    <td>Ветер</td>
                    <td>${data.daily.windspeed_10m_max[0]} м/с</td>
                    <td>${data.daily.windspeed_10m_max[1]} м/с</td>
                    <td>${data.daily.windspeed_10m_max[2]} м/с</td>
                </tr>
            </table>
        </div>
    `;
}


addCityToggle.onclick = () => {
    addCitySection.classList.toggle("hidden");
};

cityInput.addEventListener("input", () => {
    suggestionsDiv.innerHTML = "";
    cityError.textContent = "";

    const value = cityInput.value.toLowerCase();
    if (!value) return;

    allCities
        .filter(c => c.name.toLowerCase().includes(value))
        .forEach(c => {
            const div = document.createElement("div");
            div.className = "suggestion";
            div.textContent = c.name;
            div.onclick = () => {
                cityInput.value = c.name;
                suggestionsDiv.innerHTML = "";
            };
            suggestionsDiv.appendChild(div);
        });
});

addCityBtn.onclick = () => {
    const city = allCities.find(c => c.name === cityInput.value);

    if (!city) {
        cityError.textContent = "Такого города не существует";
        return;
    }

    if (cities.find(c => c.name === city.name)) {
        cityError.textContent = "Город уже добавлен";
        return;
    }

    cities.push(city);
    save();
    cityInput.value = "";
    addCitySection.classList.add("hidden");

    setActiveCity(city); 
};



refreshBtn.onclick = () => {
    if (activeCity) loadWeather(activeCity);
};



renderCityButtons();

if (userLocation) {
    setActiveCity(userLocation);
} else {
    requestGeo();
}
