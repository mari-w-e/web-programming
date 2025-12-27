const cityButtonsDiv = document.getElementById("cityButtons");
const weatherContainer = document.getElementById("weatherContainer");
const statusText = document.getElementById("status");

const addCityToggle = document.getElementById("addCityToggle");
const addCitySection = document.getElementById("addCitySection");
const cityInput = document.getElementById("cityInput");
const cityError = document.getElementById("cityError");
const addCityBtn = document.getElementById("addCityBtn");
const refreshBtn = document.getElementById("refreshBtn");

let cities = JSON.parse(localStorage.getItem("cities")) || [];
let userLocation = JSON.parse(localStorage.getItem("userLocation"));
let activeCity = null;


function save() {
    localStorage.setItem("cities", JSON.stringify(cities));
    localStorage.setItem("userLocation", JSON.stringify(userLocation));
}

function weatherCodeToText(code) {
    if (code === 0) return "Солнечно";
    if (code <= 2) return "Малооблачно";
    if (code <= 48) return "Пасмурно";
    if (code <= 67) return "Дождь";
    if (code <= 77) return "Снег";
    return "Осадки";
}

function formatDate(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const day = d.toLocaleDateString("ru-RU");

    if (offset === 0) return `Сегодня ${day}`;
    if (offset === 1) return `Завтра ${day}`;
    return `Послезавтра ${day}`;
}


if (!userLocation) {
    navigator.geolocation.getCurrentPosition(
        pos => {
            userLocation = {
                name: "Текущее местоположение",
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            };
            save();
            setActiveCity(userLocation);
        }
    );
}


function renderCityButtons() {
    cityButtonsDiv.innerHTML = "";

    if (userLocation) createCityButton(userLocation);
    cities.forEach(c => createCityButton(c));
}

function createCityButton(city) {
    const btn = document.createElement("button");
    btn.textContent = city.name;

    if (activeCity && city.name === activeCity.name) {
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
    statusText.textContent = "Загрузка...";
    weatherContainer.innerHTML = "";

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&timezone=auto`)
        .then(r => r.json())
        .then(data => {
            statusText.textContent = "";
            renderWeather(city.name, data);
        })
        .catch(() => statusText.textContent = "Ошибка загрузки");
}

function renderWeather(name, data) {
    const weatherText = weatherCodeToText(data.current_weather.weathercode);

    weatherContainer.innerHTML = `
        <div class="current-weather">
            <h2>${name}</h2>
            <div class="current-temp">${data.current_weather.temperature}°C</div>
            <p>Максимальная: ${data.daily.temperature_2m_max[0]}°C</p>
            <p>Минимальная: ${data.daily.temperature_2m_min[0]}°C</p>
            <p>Состояние: ${weatherText}</p>
            <p>Ветер: ${data.current_weather.windspeed} м/с</p>
        </div>

        <div class="forecast-table">
            <table>
                <tr>
                    <th></th>
                    <th>${formatDate(0)}</th>
                    <th>${formatDate(1)}</th>
                    <th>${formatDate(2)}</th>
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
                    <td>Состояние</td>
                    <td>${weatherCodeToText(data.daily.weathercode[0])}</td>
                    <td>${weatherCodeToText(data.daily.weathercode[1])}</td>
                    <td>${weatherCodeToText(data.daily.weathercode[2])}</td>
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
    addCitySection.classList.toggle("collapsed");
};

addCityBtn.onclick = () => {
    const name = cityInput.value.trim();
    if (!name) return;

    cityError.textContent = "";
    statusText.textContent = "Поиск города...";

    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&language=ru`)
        .then(r => r.json())
        .then(data => {
            if (!data.results) {
                cityError.textContent = "Город не найден";
                statusText.textContent = "";
                return;
            }

            const city = {
                name: data.results[0].name,
                lat: data.results[0].latitude,
                lon: data.results[0].longitude
            };

            cities.push(city);
            save();
            cityInput.value = "";
            addCitySection.classList.add("collapsed");
            setActiveCity(city);
        });
};


refreshBtn.onclick = () => {
    if (activeCity) loadWeather(activeCity);
};


renderCityButtons();
if (userLocation) setActiveCity(userLocation);
