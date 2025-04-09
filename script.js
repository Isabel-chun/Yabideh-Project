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

  // ★ 새롭게 추가: 지도 우측 상단에 지역 정보 컨트롤 생성
  var regionControl = L.control({ position: 'topright' });
  regionControl.onAdd = function(map) {
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
        cities.forEach(function (city) {
          var coords = [parseFloat(city.latitude), parseFloat(city.longitude)];
          // 키워드 문자열을 배열로 변환 (콤마 구분)
          var keywords = city.keywords.split(',').map(keyword => keyword.trim());
          city.keywords = keywords;
          // region 필드가 없으면 "Unknown"으로 설정
          city.region = city.region || "Unknown";

          var marker = L.marker(coords).bindPopup(
            '<b>' + city.name + '</b><br>Keywords: ' + keywords.join(", ")
          );
          cityMarkers[city.name] = marker;
        });
      }
    });
  }

  // 키워드 필터링 및 지도 업데이트 (선택된 키워드에 대한 인기 region 집계 포함)
  window.filterCities = function() {
    var selectedKeywords = [];
    document.querySelectorAll('#checkbox-panel input:checked').forEach(function (checkbox) {
      selectedKeywords.push(checkbox.value);
    });

    // 모든 마커 제거
    Object.values(cityMarkers).forEach(function (marker) {
      map.removeLayer(marker);
    });

    // 선택된 키워드를 포함하는 도시만 지도에 추가
    if (selectedKeywords.length > 0) {
      cities.forEach(function (city) {
        if (selectedKeywords.some(function (keyword) {
          return city.keywords.includes(keyword);
        })) {
          cityMarkers[city.name].addTo(map);
        }
      });
    }

    // ★ 각 선택된 키워드별로 도시의 region 집계
    var keywordRegions = {};
    selectedKeywords.forEach(function(keyword) {
      var counts = {};
      cities.forEach(function(city) {
        if (city.keywords.includes(keyword)) {
          var region = city.region;
          counts[region] = (counts[region] || 0) + 1;
        }
      });
      var maxCount = 0;
      var popularRegion = "None";
      for (var region in counts) {
        if (counts[region] > maxCount) {
          maxCount = counts[region];
          popularRegion = region;
        }
      }
      keywordRegions[keyword] = popularRegion;
    });

    // ★ 지도 상의 커스텀 컨트롤 영역 업데이트 (예: "paint - Asia")
    var infoHtml = "<strong>Keyword Region Info</strong><br>";
    for (var keyword in keywordRegions) {
      infoHtml += keyword + " - " + keywordRegions[keyword] + "<br>";
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
