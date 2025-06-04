

// 1. Sua chave de API do OpenWeatherMap
const apiKey = ''; 

const cityInputTop = document.getElementById('cityInputTop');
const labelCurrentLocation = document.getElementById('labelCurrentLocation');
const statusMessage = document.getElementById('statusMessage');

const cityNameEl = document.getElementById('cityName');
const localTimeEl = document.getElementById('localTime');
const iconCurrentEl = document.getElementById('iconCurrent');
const descriptionCurrentEl = document.getElementById('descriptionCurrent');
const temperatureCurrentEl = document.getElementById('temperatureCurrent');
const feelsLikeEl = document.getElementById('feelsLikeCurrent');
const summaryCurrentEl = document.getElementById('summaryCurrent');

const airQualityIndexEl = document.getElementById('airQualityIndex');
const windCurrentEl = document.getElementById('windCurrent');
const humidityCurrentEl = document.getElementById('humidityCurrent');
const visibilityCurrentEl = document.getElementById('visibilityCurrent');
const pressureCurrentEl = document.getElementById('pressureCurrent');
const dewPointCurrentEl = document.getElementById('dewPointCurrent');

const forecastContainer = document.querySelector('[data-content="overview"] .flex');


function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document
    .getElementById('themeIcon')
    .setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  lucide.createIcons();
}


window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const html = document.documentElement;
  if (savedTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  document
    .getElementById('themeIcon')
    .setAttribute(
      'data-lucide',
      html.classList.contains('dark') ? 'sun' : 'moon'
    );
  lucide.createIcons();

  initTabs();
});


async function getWeatherByCity(city) {
  if (!city) return;

  statusMessage && (statusMessage.textContent = '');

  try {
   
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${apiKey}&units=metric&lang=pt`
    );
    if (!currentRes.ok) throw new Error('Cidade não encontrada.');
    const currentData = await currentRes.json();

    const { coord } = currentData; 
    const airRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}`
    );
    const airData = airRes.ok ? await airRes.json() : null;

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${
        coord.lat
      }&lon=${coord.lon}&appid=${apiKey}&units=metric&lang=pt`
    );
    if (!forecastRes.ok) throw new Error('Previsão indisponível.');
    const forecastData = await forecastRes.json();

    
    displayCurrentWeather(currentData, airData);

    
    displayForecast(forecastData);

    
    statusMessage.textContent = '';
  } catch (error) {
    statusMessage.textContent = error.message;
  }
}

cityInputTop.addEventListener('blur', () => {
  
});


function getWeatherByCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada neste navegador.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
 
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=pt`
      )
        .then((res) => {
          if (!res.ok) throw new Error('Não foi possível obter a localização.');
          return res.json();
        })
        .then((data) => {
          
          cityInputTop.value = data.name;
          labelCurrentLocation.textContent = `${data.name} • ${Math.round(
            data.main.temp
          )}°C`;
          getWeatherByCity(data.name);
        })
        .catch((err) => {
          alert(err.message);
        });
    },
    () => {
      alert('Permissão de localização negada.');
    }
  );
}


function displayCurrentWeather(data, airData) {
  const { name, main, weather, wind, sys } = data;
  const description = weather[0].description;
  const icon = weather[0].icon;


  const timezoneOffset = data.timezone; 
  const localTimestamp =
    Date.now() + timezoneOffset * 1000 - new Date().getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(localTimestamp);
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');

  cityNameEl.textContent = name;
  localTimeEl.textContent = `Agora • ${hours}:${minutes}`;

  iconCurrentEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  iconCurrentEl.alt = description;

  descriptionCurrentEl.textContent = description;
  temperatureCurrentEl.textContent = Math.round(main.temp);
  feelsLikeEl.textContent = `Sensação: ${Math.round(main.feels_like)}°C`;
  summaryCurrentEl.textContent = `Expectativa: ${capitalizeFirstLetter(
    getSummaryByWeatherMain(weather[0].main)
  )}.`;

  
  if (airData && airData.list && airData.list.length > 0) {
    const aqi = airData.list[0].main.aqi; 
    airQualityIndexEl.textContent = `${aqi}`;
  } else {
    airQualityIndexEl.textContent = '—';
  }

  
  windCurrentEl.textContent = (wind.speed * 3.6).toFixed(1);
 
  humidityCurrentEl.textContent = main.humidity;

  visibilityCurrentEl.textContent = (data.visibility / 1000).toFixed(1);

  pressureCurrentEl.textContent = main.pressure;

  const dewPoint = calculateDewPoint(main.temp, main.humidity);
  dewPointCurrentEl.textContent = dewPoint.toFixed(1);
}


function displayForecast(forecastData) {
 
  forecastContainer.innerHTML = '';

  
  const groupedByDate = {};
  forecastData.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(item);
  });

  
  const today = new Date().toISOString().split('T')[0];
  const dates = Object.keys(groupedByDate)
    .filter((d) => d !== today)
    .slice(0, 5);

  dates.forEach((date) => {
    
    const middayItem =
      groupedByDate[date].find((item) => item.dt_txt.includes('12:00:00')) ||
      groupedByDate[date][0];
    const { weather, main } = middayItem;
    const icon = weather[0].icon;
    const description = weather[0].description;

    
    const dateObj = new Date(date);
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', options);

    
    const card = document.createElement('div');
    card.className =
      'min-w-[120px] bg-gray-100 dark:bg-gray-700 bg-opacity-60 dark:bg-opacity-50 rounded-xl p-4 text-center flex flex-col items-center space-y-2 shadow-md animate__animated animate__fadeInUp';
    card.innerHTML = `
      <p class="font-semibold">${dateFormatted}</p>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="w-12 h-12 mx-auto" />
      <p class="capitalize text-sm text-gray-700 dark:text-gray-300">${description}</p>
      <p class="text-xl font-bold">${Math.round(main.temp)}°C</p>
    `;
    forecastContainer.appendChild(card);
  });
}


function initTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
     
      tabs.forEach((t) => {
        t.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
        t.classList.add('hover:bg-gray-100', 'dark:hover:bg-gray-700');
      });
      
      contents.forEach((c) => c.classList.add('hidden'));

      
      tab.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-200');
      tab.classList.remove('hover:bg-gray-100', 'dark:hover:bg-gray-700');

      
      const target = tab.getAttribute('data-tab');
      document.querySelector(`.tab-content[data-content="${target}"]`).classList.remove('hidden');
    });
  });
}


function calculateDewPoint(T, RH) {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * T) / (b + T)) + Math.log(RH / 100);
  const dew = (b * alpha) / (a - alpha);
  return dew;
}


function getSummaryByWeatherMain(main) {
  switch (main) {
    case 'Clear':
      return 'céu limpo';
    case 'Clouds':
      return 'céu nublado';
    case 'Rain':
    case 'Drizzle':
      return 'chuvas eventuais';
    case 'Thunderstorm':
      return 'trovoadas';
    case 'Snow':
      return 'neve';
    case 'Mist':
    case 'Fog':
    case 'Haze':
      return 'neblina';
    default:
      return 'calmo';
  }
}


function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
