const cityButtonsDiv = document.getElementById("cityButtons");
const weatherContainer = document.getElementById("weatherContainer");
const statusText = document.getElementById("status");

const addCityToggle = document.getElementById("addCityToggle");
const cityModal = document.getElementById("cityModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cityInput = document.getElementById("cityInput");
const cityError = document.getElementById("cityError");
const addCityBtn = document.getElementById("addCityBtn");
const refreshBtn = document.getElementById("refreshBtn");
const suggestionsDiv = document.getElementById("suggestions");

let cities = JSON.parse(localStorage.getItem("cities")) || [];
let userLocation = JSON.parse(localStorage.getItem("userLocation"));
let activeCity = null;
let selectedCity = null;

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
            userLocation = {name: "Текущее местоположение", lat: pos.coords.latitude, lon: pos.coords.longitude};
            save();
            setActiveCity(userLocation);
        },
        () => {
            cityModal.classList.remove("hidden");
            statusText.textContent = "Введите город вручную";
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
    if (activeCity && city.name === activeCity.name) btn.classList.add("active");
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
            <p>Макс. t°C: ${data.daily.temperature_2m_max[0]}°C</p>
            <p>Мин. t°C: ${data.daily.temperature_2m_min[0]}°C</p>
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
                    <td>Максимальная t°C</td>
                    <td>${data.daily.temperature_2m_max[0]}</td>
                    <td>${data.daily.temperature_2m_max[1]}</td>
                    <td>${data.daily.temperature_2m_max[2]}</td>
                </tr>
                <tr>
                    <td>Минимальная t°C</td>
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
    cityModal.classList.remove("hidden");
    cityError.textContent = "";
    cityInput.value = "";
    suggestionsDiv.innerHTML = "";
};

closeModalBtn.onclick = () => cityModal.classList.add("hidden");

cityInput.addEventListener("input", () => {
    const value = cityInput.value.trim();
    selectedCity = null;
    suggestionsDiv.innerHTML = "";
    if (value.length < 2) return;
    const fragment = document.createDocumentFragment();
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${value}&count=5&language=ru`)
        .then(r => r.json())
        .then(data => {
            if (!data.results) return;
            data.results.forEach(item => {
                const div = document.createElement("div");
                div.className = "suggestion";
                div.textContent = `${item.name}, ${item.country}`;
                div.onclick = () => {
                    cityInput.value = item.name;
                    selectedCity = {name: item.name, lat: item.latitude, lon: item.longitude};
                    suggestionsDiv.innerHTML = "";
                };
                fragment.appendChild(div);
            });
            suggestionsDiv.appendChild(fragment);
        });
});

addCityBtn.onclick = () => {
    cityError.textContent = "";
    if (!selectedCity) {
        cityError.textContent = "Выберите город из списка";
        return;
    }
    if (cities.find(c => c.name === selectedCity.name)) {
        cityError.textContent = "Город уже добавлен";
        return;
    }
    cities.push(selectedCity);
    save();
    setActiveCity(selectedCity);
    cityModal.classList.add("hidden");
    cityInput.value = "";
    selectedCity = null;
    suggestionsDiv.innerHTML = "";
};

refreshBtn.onclick = () => { if (activeCity) loadWeather(activeCity); };

renderCityButtons();
if (userLocation) setActiveCity(userLocation);
