"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // 언어 전환 함수
  function toggleLanguage(languageToggle) {
    var isKorean = languageToggle.innerText === 'KR';
    languageToggle.innerText = isKorean ? 'EN' : 'KR';

    var elements = document.querySelectorAll('[data-en], [data-kr]');
    elements.forEach(function (element) {
      var currentText = isKorean ? element.getAttribute('data-en') : element.getAttribute('data-kr');
      element.innerText = currentText;
    });
  }

  // 지도 생성
  var map = L.map('map').setView([41.5, -72.6], 4);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // 지도 우측 상단에 지역 정보 컨트롤 생성
  var regionControl = L.control({ position: 'topright' });
  regionControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'region-control');
    div.style.backgroundColor = "white";
    div.style.padding = "10px";
    div.style.border = "1px solid #ccc";
    div.style.fontSize = "14px";
    div.innerHTML = "<strong>Keyword Region Info</strong>";
    return div;
  };
  regionControl.addTo(map);

  var cityMarkers = {};
  var cities = []; // 전역에 도시 데이터를 저장

  // CSV 파일에서 데이터 로드 및 마커 생성
  function loadCityData() {
    Papa.parse('./final_data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        cities = results.data;
        cities.push({
    name: "Israel",
    latitude: 31.0461,      // 이스라엘 중심 위도
    longitude: 34.8516,     // 이스라엘 중심 경도
    keywords: ["photograph", "sculptur", "contemporary"],  // 키워드 3개
    keyword_1: "photograph",
    keyword_2: "sculptur",
    keyword_3: "contemporary",
    count_1: "1",
    count_2: "1",
    count_3: "1"
});
        cities.forEach(function (city) {
          var lat = parseFloat(city.latitude);
          var lng = parseFloat(city.longitude);
  
          // Skip rows with invalid latitude or longitude
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Skipping city with invalid coordinates: ${city.name}`);
            return;
          }
  
          var coords = [lat, lng];
          var keywords = [
            city.keyword_1,
            city.keyword_2,
            city.keyword_3
          ].filter(Boolean); // Ensure no empty keywords
          city.keywords = keywords;
  
          var marker = L.marker(coords).bindPopup(
            `<b>${city.name}</b><br>Keywords: ${keywords.join(", ")}`
          );
          cityMarkers[city.name] = marker;
        });
      },
      error: function (error) {
        console.error("Error loading CSV data:", error);
      }
    });
  }

  // 키워드 필터링 및 지도 업데이트
  window.filterCities = function () {
    var selectedKeywords = [];
    document.querySelectorAll('#checkbox-panel input:checked').forEach(function (checkbox) {
      selectedKeywords.push(checkbox.value);
    });
  
    // Remove all markers
    Object.values(cityMarkers).forEach(function (marker) {
      map.removeLayer(marker);
    });
  
    // Add markers
    if (selectedKeywords.length > 0) {
      cities.forEach(function (city) {
        if (city.keywords && selectedKeywords.some(function (keyword) {
          return city.keywords.includes(keyword);
        })) {
          cityMarkers[city.name].addTo(map);
        }
      });
    }
  
    // Find region for Keyword Region Info
    var keywordRegions = {};
    selectedKeywords.forEach(function (keyword) {
      var maxCount = 0;
      var topCity = "None";
  
      cities.forEach(function (city) {
        if (city.keyword_1 === keyword && parseFloat(city.count_1) > maxCount) {
          maxCount = parseFloat(city.count_1);
          topCity = city.name;
        }
        if (city.keyword_2 === keyword && parseFloat(city.count_2) > maxCount) {
          maxCount = parseFloat(city.count_2);
          topCity = city.name;
        }
        if (city.keyword_3 === keyword && parseFloat(city.count_3) > maxCount) {
          maxCount = parseFloat(city.count_3);
          topCity = city.name;
        }
      });
  
      keywordRegions[keyword] = topCity;
    });
  
    // Update Keyword Region Info
    var infoHtml = "<strong>Keyword Region Info</strong><br>";
    for (var keyword in keywordRegions) {
      infoHtml += `${keyword} - ${keywordRegions[keyword]}<br>`;
    }
    document.querySelector('.region-control').innerHTML = infoHtml;
  };

  // 언어 전환 버튼 이벤트 설정
  var languageButton = document.querySelector('#language-toggle');
  if (languageButton) {
    languageButton.addEventListener('click', function () {
      toggleLanguage(languageButton);
    });
  }

  // 도시 데이터 로드
  loadCityData();
});

document.addEventListener("DOMContentLoaded", function() {
    const flag = document.querySelector('.leaflet-control-attribution .leaflet-attribution-flag');
    if (flag) {
        flag.remove();
    }
});
