"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // 언어 전환 함수
  function toggleLanguage(languageToggle) {
    var isKorean = languageToggle.innerText === 'KR'; // 언어 상태 확인
    languageToggle.innerText = isKorean ? 'EN' : 'KR'; // 언어 변경

    var elements = document.querySelectorAll('[data-en], [data-kr]');
    elements.forEach(function (element) {
      var currentText = isKorean ? element.getAttribute('data-en') : element.getAttribute('data-kr');
      element.innerText = currentText;
    });
  }

  // 지도 생성
  var map = L.map('map').setView([41.5, -72.6], 4); // Initial zoom out to cover more locations

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  var cityMarkers = {};
  var cities = []; // Global cities array to use in filterCities

  // CSV 파일에서 데이터 읽기 및 지도에 마커 추가
  function loadCityData() {
    Papa.parse('./final_data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        cities = results.data; // Store cities globally

        // 각 도시 데이터를 기반으로 마커 생성
        cities.forEach(function (city) {
          var coords = [parseFloat(city.latitude), parseFloat(city.longitude)];
          var keywords = city.keywords.split(',').map(keyword => keyword.trim());

          var marker = L.marker(coords).bindPopup(
            '<b>' + city.name + '</b><br>Keywords: ' + keywords.join(", ")
          );
          cityMarkers[city.name] = marker;

          // 도시 객체에 키워드 추가 (필터링 기능에 사용)
          city.keywords = keywords;
        });
      }
    });
  }

  // 도시 필터링
  window.filterCities = function() {
    var selectedKeywords = [];
    document.querySelectorAll('#checkbox-panel input:checked').forEach(function (checkbox) {
      selectedKeywords.push(checkbox.value);
    });

    // 모든 마커 삭제
    Object.values(cityMarkers).forEach(function (marker) {
      map.removeLayer(marker);
    });

    // 키워드가 있어야만 마커 추가
    if (selectedKeywords.length > 0) {
      cities.forEach(function (city) {
        if (selectedKeywords.some(function (keyword) {
          return city.keywords.includes(keyword);
        })) {
          cityMarkers[city.name].addTo(map);
        }
      });
    }
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