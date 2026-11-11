//Перевірка підключення файлу
console.log("script.js підключено");

(() => {
  //Стрілкова функція для обчислення Фаренгейтів з Цельсія
  const toFahrenheit = (c) => (c * 9) / 5 + 32;

  // Локальні константи API
  const localApiKey = "a66281db80595ed12520a9c8df8e5b0a";
  const localApiUrl = "https://api.openweathermap.org/data/2.5/forecast";

  /**
   *Обробка REAL-TIME даних за введеним містом
   */
  async function processUserCityForecast(city) {
    if (!city) return;

    console.log(`\n--- [script.js] Отримання та обробка даних для міста: ${city} ---`);

    try {
      const response = await fetch(
        `${localApiUrl}?q=${encodeURIComponent(city)}&appid=${localApiKey}&units=metric&lang=ua`
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Помилка API у script.js:", data.message);
        return;
      }

      //Створення масиву об'єктів з реальних даних API (на 5 днів)
      const realForecastArray = [];

      for (let i = 0; i < data.list.length; i += 8) {
        const item = data.list[i];

        realForecastArray.push({
          day: new Date(item.dt * 1000).toLocaleDateString("uk-UA", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
          temp: Math.round(item.main.temp),
        });

        if (realForecastArray.length === 5) break;
      }

      //(Результат): Масив об'єктів прогнозу
      console.log("Крок 4. Сформований масив об'єктів:", realForecastArray);

      console.log("\nКрок 5 & 6. Результат обробки циклом for...of:");

      //Обробка масиву циклом for...of
      for (const dayData of realForecastArray) {
        //Виклик стрілкової функції для обчислення Фаренгейтів
        const tempInFahrenheit = toFahrenheit(dayData.temp).toFixed(1);

        //Умовна класифікація (якщо нижче 0°C — «морозно»)
        if (dayData.temp < 0) {
          console.log(
            `${dayData.day}: ${dayData.temp}°C (${tempInFahrenheit}°F) — морозно`
          );
        } else {
          console.log(
            `${dayData.day}: ${dayData.temp}°C (${tempInFahrenheit}°F)`
          );
        }
      }
    } catch (err) {
      console.error("Помилка виконання у script.js:", err);
    }
  }

  // Прив'язуємо обробники з фазою перехоплення (useCapture: true)
  // Це гарантує, що script.js прочитає поле ДО ТОГО, як app.js його очистить
  document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.querySelector(".input-selection input");
    const cityButton = document.querySelector(".input-selection button");

    if (cityInput && cityButton) {
      let currentCity = "";

      // Перехоплюємо текст з поля при натисканні
      cityButton.addEventListener(
        "click",
        () => {
          currentCity = cityInput.value.trim();
          if (currentCity) processUserCityForecast(currentCity);
        },
        true // true = запуск раніше за app.js
      );

      cityInput.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Enter") {
            currentCity = cityInput.value.trim();
            if (currentCity) processUserCityForecast(currentCity);
          }
        },
        true // true = запуск раніше за app.js
      );
    }
  });
})();
