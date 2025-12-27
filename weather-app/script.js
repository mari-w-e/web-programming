const weatherContainer = document.getElementById("weather-container");
const statusText = document.getElementById("status");
const addCitySection = document.getElementById("add-city-section");
const cityInput = document.getElementById("cityInput");
const suggestionsDiv = document.getElementById("suggestions");
const cityError = document.getElementById("cityError");

const refreshBtn = document.getElementById("refreshBtn");
const addCityBtn = document.getElementById("addCityBtn");

const cities = [
    { name: "Москва", lat: 55.75, lon: 37.61 },
    { name: "Санкт-Петербург", lat: 59.93, lon: 30.31 },
    { name: "Казань", lat: 55.79, lon: 49.12 },
    { name: "Новосибирск", lat: 55.03, lon: 82.92 },
    { name: "Екатеринбург", lat: 56.84, lon: 60.61 }
];

let savedCities = JSON.parse(localStorage.getItem("cities")) || [];
let userLocation = JSON.parse(localStorage.getItem("userLocation"));

function saveData() {
    localStorage.setItem("cities", JSON.stringify(savedCities));
    localStorage.setItem("userLocation", JSON.stringify(userLocation));
}

function fetchWeather(lat, lon, title) {
    statusText.textContent = "Загрузка погоды...";

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto`)
        .then(res => res.json())
        .then(data => {
            statusText.textContent = "";
            renderCard(title, data.daily.temperature_2m_max);
        })
        .catch(() => {
            statusText.textContent = "Ошибка загрузки погоды";
        });
}

function renderCard(title, temps) {
    let html = `
        <div class="city-card">
            <h3>${title}</h3>
            <div class="forecast">
                <div class="day">Сегодня<br>${temps[0]}°C</div>
                <div class="day">Завтра<br>${temps[1]}°C</div>
                <div class="day">Послезавтра<br>${temps[2]}°C</div>
            </div>
        </div>
    `;
    weatherContainer.innerHTML += html;
}

function loadAllWeather() {
    weatherContainer.innerHTML = "";

    if (userLocation) {
        fetchWeather(userLocation.lat, userLocation.lon, "Текущее местоположение");
    }

    savedCities.forEach(city => {
        fetchWeather(city.lat, city.lon, city.name);
    });
}

function requestGeo() {
    if (!navigator.geolocation) {
        addCitySection.classList.remove("hidden");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            userLocation = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            };
            saveData();
            loadAllWeather();
        },
        () => {
            addCitySection.classList.remove("hidden");
        }
    );
}

cityInput.addEventListener("input", () => {
    suggestionsDiv.innerHTML = "";
    cityError.textContent = "";

    const value = cityInput.value.toLowerCase();
    if (!value) return;

    cities
        .filter(c => c.name.toLowerCase().includes(value))
        .forEach(c => {
            const div = document.createElement("div");
            div.textContent = c.name;
            div.className = "suggestion";
            div.onclick = () => {
                cityInput.value = c.name;
                suggestionsDiv.innerHTML = "";
            };
            suggestionsDiv.appendChild(div);
        });
});

addCityBtn.addEventListener("click", () => {
    const cityName = cityInput.value;
    const city = cities.find(c => c.name === cityName);

    if (!city) {
        cityError.textContent = "Такого города нет";
        return;
    }

    if (savedCities.find(c => c.name === city.name)) {
        cityError.textContent = "Город уже добавлен";
        return;
    }

    savedCities.push(city);
    saveData();
    cityInput.value = "";
    loadAllWeather();
});

refreshBtn.addEventListener("click", () => {
    loadAllWeather();
});

if (userLocation || savedCities.length > 0) {
    loadAllWeather();
} else {
    requestGeo();
}
