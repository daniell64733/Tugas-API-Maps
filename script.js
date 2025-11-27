// API Key yang valid dari OpenWeatherMap
const apiKey = "0c598dff46ae3b0f27c3c56d28f6980c";

// Inisialisasi peta dengan tampilan dunia
const map = L.map("map").setView([-6.2088, 106.8456], 10);

// Tambahkan layer peta dari OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Tambahkan marker untuk lokasi yang dipilih
let marker = null;

// Elemen DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationInfo = document.getElementById("locationInfo");
const errorMessage = document.getElementById("errorMessage");
const loadingIndicator = document.getElementById("loadingIndicator");

// Data populasi untuk fallback
const populationData = {
  jakarta: 10770487,
  surabaya: 2843500,
  bandung: 2426500,
  medan: 2097610,
  london: 8982000,
  "new york": 8336817,
  tokyo: 13929286,
  paris: 2140526,
  singapore: 5685807,
  "kuala lumpur": 1588800,
  bali: 4300000,
  yogyakarta: 422732,
};

// Fungsi untuk mendapatkan data lokasi dari OpenWeatherMap Geocoding API
async function getLocationData(cityName) {
  try {
    console.log("Mencari data lokasi untuk:", cityName);

    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        cityName
      )}&limit=1&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Data lokasi diterima:", data);

    if (data.length === 0) {
      throw new Error("Kota tidak ditemukan");
    }

    return data[0];
  } catch (error) {
    console.error("Error mengambil data lokasi:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan data cuaca dari OpenWeatherMap
async function getWeatherData(lat, lon) {
  try {
    console.log("Mencari data cuaca untuk:", lat, lon);

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=id`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Data cuaca diterima:", data);
    return data;
  } catch (error) {
    console.error("Error mengambil data cuaca:", error);
    throw error;
  }
}

// Fungsi untuk mendapatkan populasi
function getPopulation(cityName) {
  const normalizedName = cityName.toLowerCase();
  return populationData[normalizedName] || "Data tidak tersedia";
}

// Fungsi untuk menampilkan data lokasi
function displayLocationInfo(locationData, weatherData) {
  const population = getPopulation(locationData.name);

  document.getElementById("cityName").textContent = locationData.name;
  document.getElementById("country").textContent = locationData.country;
  document.getElementById("population").textContent =
    typeof population === "number" ? population.toLocaleString() : population;

  // Timezone dari data cuaca
  const timezoneOffset = weatherData.timezone / 3600;
  document.getElementById("timezone").textContent = `UTC${
    timezoneOffset >= 0 ? "+" : ""
  }${timezoneOffset}`;

  document.getElementById(
    "coordinates"
  ).textContent = `${locationData.lat.toFixed(4)}, ${locationData.lon.toFixed(
    4
  )}`;

  // Tampilkan informasi cuaca
  document.getElementById("temperature").textContent = `${Math.round(
    weatherData.main.temp
  )}°C`;
  document.getElementById("weatherDescription").textContent =
    weatherData.weather[0].description;
  document.getElementById(
    "humidity"
  ).textContent = `${weatherData.main.humidity}%`;
  document.getElementById(
    "windSpeed"
  ).textContent = `${weatherData.wind.speed} m/s`;
  document.getElementById(
    "pressure"
  ).textContent = `${weatherData.main.pressure} hPa`;

  // Set ikon cuaca berdasarkan kondisi
  const weatherIcon = document.getElementById("weatherIcon");
  const weatherCode = weatherData.weather[0].id;

  if (weatherCode >= 200 && weatherCode < 300) {
    weatherIcon.textContent = "⛈️";
  } else if (weatherCode >= 300 && weatherCode < 500) {
    weatherIcon.textContent = "🌧️";
  } else if (weatherCode >= 500 && weatherCode < 600) {
    weatherIcon.textContent = "🌧️";
  } else if (weatherCode >= 600 && weatherCode < 700) {
    weatherIcon.textContent = "❄️";
  } else if (weatherCode >= 700 && weatherCode < 800) {
    weatherIcon.textContent = "🌫️";
  } else if (weatherCode === 800) {
    weatherIcon.textContent = "☀️";
  } else if (weatherCode > 800) {
    weatherIcon.textContent = "☁️";
  }

  // Tampilkan kartu informasi
  locationInfo.classList.add("active");
  errorMessage.classList.remove("active");
}

// Fungsi untuk menampilkan error
function displayError(
  message = "Kota tidak ditemukan. Silakan coba lagi dengan nama kota yang valid."
) {
  locationInfo.classList.remove("active");
  errorMessage.querySelector("p").textContent = message;
  errorMessage.classList.add("active");
}

// Fungsi untuk mencari lokasi
async function searchLocation() {
  const cityName = cityInput.value.trim();

  if (!cityName) {
    alert("Silakan masukkan nama kota");
    return;
  }

  // Tampilkan indikator loading
  loadingIndicator.classList.add("active");
  locationInfo.classList.remove("active");
  errorMessage.classList.remove("active");

  try {
    // Dapatkan data lokasi
    const locationData = await getLocationData(cityName);

    // Dapatkan data cuaca
    const weatherData = await getWeatherData(
      locationData.lat,
      locationData.lon
    );

    // Update peta dengan lokasi baru
    map.setView([locationData.lat, locationData.lon], 12);

    // Hapus marker lama jika ada
    if (marker) {
      map.removeLayer(marker);
    }

    // Tambahkan marker baru
    marker = L.marker([locationData.lat, locationData.lon])
      .addTo(map)
      .bindPopup(
        `<b>${locationData.name}</b><br>${locationData.country}<br>${Math.round(
          weatherData.main.temp
        )}°C - ${weatherData.weather[0].description}`
      )
      .openPopup();

    // Tampilkan informasi lokasi
    displayLocationInfo(locationData, weatherData);
  } catch (error) {
    console.error("Error:", error);
    if (error.message.includes("Kota tidak ditemukan")) {
      displayError(
        "Kota tidak ditemukan. Coba: Jakarta, London, Tokyo, New York, dll."
      );
    } else {
      displayError("Terjadi error. Silakan coba lagi.");
    }
  } finally {
    // Sembunyikan indikator loading
    loadingIndicator.classList.remove("active");
  }
}

// Event listener untuk tombol pencarian
searchBtn.addEventListener("click", searchLocation);

// Event listener untuk menekan Enter di input
cityInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    searchLocation();
  }
});

// Tampilkan data untuk Jakarta secara default saat pertama kali load
window.addEventListener("load", function () {
  cityInput.value = "Jakarta";
  // Tunggu sebentar agar peta selesai load
  setTimeout(() => {
    searchLocation();
  }, 1000);
});

// Fungsi untuk menangani error peta
map.on("error", function (e) {
  console.error("Map error:", e);
});

// Tambahkan placeholder yang informatif
cityInput.setAttribute(
  "placeholder",
  "Contoh: Jakarta, London, Tokyo, New York..."
);
