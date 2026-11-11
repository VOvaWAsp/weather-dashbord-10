// Обираємо React, оскільки він дозволяє створювати компоненти
// та автоматично оновлювати інтерфейс при зміні стану.

const apiKey = "a66281db80595ed12520a9c8df8e5b0a";

const apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=";

const weatherSearchForm = document.querySelector("#weather-search-form");
const cityInput = document.querySelector("#weather-input");
const error = document.querySelector(".error");

const containerSingle = document.querySelector("#current-weather");
const weatherImg = document.querySelector(".weather-img");

const weatherForm = document.querySelector("#weather-form");
const dayInput = document.querySelector("#day");
const tempInput = document.querySelector("#tempC");
const descriptionInput = document.querySelector("#description");
const recordsList = document.querySelector("#records-list");
const hottestDayButton = document.querySelector("#hottest-day-button");
const hottestDayResult = document.querySelector("#hottest-day-result");

const weatherRecords = [];

const weatherTranslations = {
    "clear sky": "Ясно",
    "few clouds": "Малохмарно",
    "scattered clouds": "Мінлива хмарність",
    "broken clouds": "Хмарно",
    "overcast clouds": "Похмуро",
    "shower rain": "Злива",
    "rain": "Дощ",
    "light rain": "Невеликий дощ",
    "moderate rain": "Помірний дощ",
    "heavy intensity rain": "Сильний дощ",
    "thunderstorm": "Гроза",
    "snow": "Сніг",
    "mist": "Туман",
    "fog": "Туман"
};

async function getWeather(city) {
    try {
        const response = await fetch(
            `${apiUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Місто не знайдено");
        }

        const temperature = Math.round(data.main.temp);

        document.querySelector(".city").textContent = data.name;
        document.querySelector(".temp").textContent = `${temperature}°C`;

        const description = data.weather[0].description;

        document.querySelector(".description").textContent =
            weatherTranslations[description] || description;

        weatherImg.src =
            `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        weatherImg.alt = description;

        containerSingle.classList.remove("cold", "warm", "mild");

        if (temperature <= 10) {
            containerSingle.classList.add("cold");
        } else if (temperature >= 25) {
            containerSingle.classList.add("warm");
        } else {
            containerSingle.classList.add("mild");
        }

        error.style.display = "none";
        containerSingle.style.display = "block";

    } catch (err) {
        console.error("Помилка отримання поточної погоди:", err);

        error.textContent =
            "Не вдалося знайти місто. Перевірте назву та спробуйте ще раз.";

        error.style.display = "block";
        containerSingle.style.display = "none";
    }
}


function WeatherCard({
    day,
    tempC,
    description,
    icon,
    showFahrenheit,
    onToggle
}) {
    const tempF = (tempC * 9) / 5 + 32;

    return (
        <article
            className={`forecast-card ${tempC <= 10 ? "cold" : ""}`}
            onClick={onToggle}
            role="button"
            tabIndex="0"
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggle();
                }
            }}
        >
            <h3>{day}</h3>

            <img
                className="forecast-icon"
                src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                alt={description}
            />

            <p>
                {tempC}°C
                {showFahrenheit && ` / ${tempF.toFixed(1)}°F`}
            </p>

            <p>{description}</p>

            <small>Натисніть, щоб показати °F</small>
        </article>
    );
}


function WeatherApp() {
    const [forecastData, setForecastData] = React.useState([]);
    const [averageTemp, setAverageTemp] = React.useState(null);
    const [forecastError, setForecastError] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    function toggleFahrenheit(id) {
        setForecastData(currentData =>
            currentData.map(item =>
                item.id === id
                    ? { ...item, showFahrenheit: !item.showFahrenheit }
                    : item
            )
        );
    }

    async function getForecast(city) {
        setLoading(true);
        setForecastError("");

        try {
            const response = await fetch(
                `${forecastUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Не вдалося отримати прогноз");
            }

            const newForecastData = data.list
                .filter((item, index) => index % 4 === 0)
                .slice(0, 7)
                .map(item => ({
                    id: item.dt,
                    day: new Date(item.dt * 1000).toLocaleString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    tempC: Math.round(item.main.temp),
                    description:
                        weatherTranslations[item.weather[0].description] ||
                        item.weather[0].description,
                    icon: item.weather[0].icon,
                    showFahrenheit: false
                }));

            setForecastData(newForecastData);

            if (newForecastData.length > 0) {
                const total = newForecastData.reduce(
                    (sum, item) => sum + item.tempC,
                    0
                );

                setAverageTemp(
                    (total / newForecastData.length).toFixed(1)
                );
            } else {
                setAverageTemp(null);
            }

            console.log("Масив даних прогнозу:", newForecastData);

        } catch (err) {
            console.error("Помилка отримання прогнозу:", err);

            setForecastData([]);
            setAverageTemp(null);
            setForecastError("Не вдалося завантажити прогноз погоди.");

        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        function handleWeatherSearch(event) {
            getForecast(event.detail);
        }

        document.addEventListener("weather-search", handleWeatherSearch);

        return () => {
            document.removeEventListener("weather-search", handleWeatherSearch);
        };
    }, []);

    return (
        <div>
            <h2 className="title">Прогноз погоди</h2>

            {loading && <p>Завантаження прогнозу...</p>}

            {forecastError && <p className="error">{forecastError}</p>}

            {!loading && !forecastError && forecastData.length === 0 && (
                <p>Введіть назву міста, щоб побачити прогноз.</p>
            )}

            {forecastData.length > 0 && (
                <>
                    <p id="avg-temp">
                        Середня температура: {averageTemp}°C
                    </p>

                    <div className="forecast-grid">
                        {forecastData.map(item => (
                            <WeatherCard
                                key={item.id}
                                day={item.day}
                                tempC={item.tempC}
                                description={item.description}
                                icon={item.icon}
                                showFahrenheit={item.showFahrenheit}
                                onToggle={() => toggleFahrenheit(item.id)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}


const forecastRoot = ReactDOM.createRoot(
    document.querySelector("#forecast")
);

forecastRoot.render(<WeatherApp />);


weatherSearchForm.addEventListener("submit", event => {
    event.preventDefault();

    searchCity();
});

function searchCity() {
    const city = cityInput.value.trim();

    if (!city) {
        cityInput.setCustomValidity("Введіть назву міста.");
        cityInput.reportValidity();
        return;
    }

    cityInput.setCustomValidity("");

    getWeather(city);

    document.dispatchEvent(
        new CustomEvent("weather-search", {
            detail: city
        })
    );

    weatherSearchForm.reset();
}

cityInput.addEventListener("input", () => {
    if (cityInput.value.trim() === "") {
        cityInput.setCustomValidity("Введіть назву міста.");
    } else {
        cityInput.setCustomValidity("");
    }
});


function renderRecords(records) {
    recordsList.replaceChildren();

    records.forEach(record => {
        const card = document.createElement("article");
        card.classList.add("forecast-card");

        const dayTitle = document.createElement("h3");
        dayTitle.textContent = record.day;

        const temperature = document.createElement("p");
        temperature.textContent = `${record.tempC}°C`;

        const description = document.createElement("p");
        description.textContent =
            record.description || "Опис відсутній";

        card.append(dayTitle, temperature, description);

        recordsList.append(card);
    });
}

weatherForm.addEventListener("submit", event => {
    event.preventDefault();

    const day = dayInput.value.trim();
    const tempC = Number(tempInput.value);
    const description = descriptionInput.value.trim();

    const newRecord = {
        day: day,
        tempC: tempC,
        description: description
    };

    weatherRecords.push(newRecord);

    renderRecords(weatherRecords);

    weatherForm.reset();

    tempInput.setCustomValidity("");

    hottestDayResult.textContent = "";
});

tempInput.addEventListener("input", () => {
    if (
        tempInput.value !== "" &&
        (
            Number(tempInput.value) < -50 ||
            Number(tempInput.value) > 50
        )
    ) {
        tempInput.setCustomValidity(
            "Температура поза реалістичним діапазоном"
        );
    } else {
        tempInput.setCustomValidity("");
    }
});

hottestDayButton.addEventListener("click", () => {
    if (weatherRecords.length === 0) {
        hottestDayResult.textContent =
            "Спочатку додайте запис про погоду.";
        return;
    }

    const hottestDay = weatherRecords.reduce((max, record) => {
        return record.tempC > max.tempC ? record : max;
    });

    hottestDayResult.textContent =
        `Найтепліший день: ${hottestDay.day}, ` +
        `${hottestDay.tempC}°C. ${hottestDay.description}`;
});


const API_URL =
    "https://api.open-meteo.com/v1/forecast?latitude=50.45&longitude=30.52&current=temperature_2m,weather_code&timezone=auto";

const updateWeatherButton =
    document.querySelector("#update-weather-button");

const loadingMessage =
    document.querySelector("#loading-message");

const apiError =
    document.querySelector("#api-error");

const apiTemperature =
    document.querySelector("#api-temperature");

const apiDescription =
    document.querySelector("#api-description");

const apiTime =
    document.querySelector("#api-time");

const weatherCodes = {
    0: "Ясно",
    1: "Переважно ясно",
    2: "Мінлива хмарність",
    3: "Похмуро",
    45: "Туман",
    48: "Паморозевий туман",
    51: "Легка мряка",
    53: "Помірна мряка",
    55: "Сильна мряка",
    56: "Легка крижана мряка",
    57: "Сильна крижана мряка",
    61: "Невеликий дощ",
    63: "Помірний дощ",
    65: "Сильний дощ",
    66: "Легкий крижаний дощ",
    67: "Сильний крижаний дощ",
    71: "Невеликий сніг",
    73: "Помірний сніг",
    75: "Сильний сніг",
    77: "Снігові зерна",
    80: "Невеликий дощ",
    81: "Помірний дощ",
    82: "Сильна злива",
    85: "Невеликий снігопад",
    86: "Сильний снігопад",
    95: "Гроза",
    96: "Гроза з невеликим градом",
    99: "Гроза із сильним градом"
};

function renderWeather(data) {
    const temperature = data.current.temperature_2m;
    const weatherCode = data.current.weather_code;
    const time = data.current.time;

    const description =
        weatherCodes[weatherCode] || "Невідомі погодні умови";

    apiTemperature.textContent =
        `Температура: ${temperature}°C`;

    apiDescription.textContent =
        `Погодні умови: ${description}`;

    apiTime.textContent =
        `Час оновлення: ${time}`;
}

async function loadData() {
    loadingMessage.style.display = "block";
    loadingMessage.textContent = "Завантаження...";

    apiError.style.display = "none";
    updateWeatherButton.disabled = true;

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(
                `Сервер відповів кодом ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Дані Open-Meteo API:", data);

        renderWeather(data);

    } catch (error) {
        console.error(
            "Помилка отримання прогнозу погоди:",
            error
        );

        apiError.textContent =
            "Не вдалося отримати прогноз погоди";

        apiError.style.display = "block";

    } finally {
        loadingMessage.style.display = "none";
        updateWeatherButton.disabled = false;
    }
}

updateWeatherButton.addEventListener("click", loadData);

loadData();

console.log("app.js підключено");
