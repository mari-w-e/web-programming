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

/* ===== STORAGE ===== */

function save() {
    localStorage.setItem("cities", JSON.stringify(cities));
    localStorage.setItem("userLocation", JSON.stringify(userLocation));
}

/* ===== GEO ===== */

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
            addCitySection.classList.remove("hidden");
        }
    );
}


function renderCityButtons() {
    cityButtonsDiv.innerHTML = "";

    if (userLocation) {
        createCityButton(userLocation);
    }

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

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max&timezone=auto`)
        .then(r => r.json())
        .then(data => {
            statusText.textContent = "";
            renderWeather(city.name, data.daily.temperature_2m_max);
        })
        .catch(() => {
            statusText.textContent = "Ошибка загрузки";
        });
}

function renderWeather(name, temps) {
    weatherContainer.innerHTML = `
        <div class="weather-card">
            <h2>${name}</h2>
            <div class="forecast">
                <div class="day">Сегодня<br>${temps[0]}°C</div>
                <div class="day">Завтра<br>${temps[1]}°C</div>
                <div class="day">Послезавтра<br>${temps[2]}°C</div>
            </div>
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
    renderCityButtons();
    cityInput.value = "";
};


refreshBtn.onclick = () => {
    if (activeCity) {
        loadWeather(activeCity);
    }
};


renderCityButtons();

if (userLocation) {
    setActiveCity(userLocation);
} else {
    requestGeo();
}
