const dayTitleElement = document.getElementById("day-title")
const searchInputElement = document.getElementById("food-search-input")
const seatchBtnElement = document.getElementById("food-search-btn")
const searchResultElement = document.getElementById("food-search-result")
const addFoodBtn = document.getElementById("add-food-btn")
const foodSearchDiv = document.getElementById("food-search-div")
const foodSearchCloserBtn = document.getElementById("food-search-closer-btn")
const goBackBtn = document.getElementById("go-back-btn")
const selectedFoodDiv = document.getElementById("selected-foods")
const totalKcalCalcEl = document.getElementById("total-kcal-calc")
const totalKcalApiEl = document.getElementById("total-kcal-api")

let selectedFoodsInfo = loadFromLocalStorage();

seatchBtnElement.addEventListener("click", () => onSearchClicked())
addFoodBtn.addEventListener("click", () => toggleFoodSearchDiv())
foodSearchCloserBtn.addEventListener("click", () => toggleFoodSearchDiv())
goBackBtn.addEventListener("click", () => goBackToCalender())


const params = new URLSearchParams(window.location.search)
const pageDate = params.get("date")

function parseSafeDate(dateString) {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
        window.location.href = `/food-calc/html/calender.html`
    }

    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    if (isNaN(date.getTime())) {
        window.location.href = `/food-calc/html/calender.html`
    }

    return date;
}
function getDayString() {
    const [year, month, day] = pageDate.split("-").map(Number)
    const date = new Date(year, month, day)

    let monthName = date.toLocaleDateString("sv-SE", {
        month: "long"
    })
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return `${day} ${monthName}`
}

function goBackToCalender() {
    const params = new URLSearchParams(window.location.search);
    const date = params.get("date");
    window.location.href = "/food-calc/html/calender.html?date=" + date
}
async function getAllFood() {
    const response = await fetch(
        "https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel?offset=0&limit=3000&sprak=1"
    );

    const data = await response.json();
    return data.livsmedel;
}
async function getNutritionalValues(id) {
    const response = await fetch(
        "https://dataportal.livsmedelsverket.se/livsmedel/api/v1/livsmedel/" + id + "/naringsvarden?sprak=1"
    );
    const data = await response.json();
    return data
}
async function getFoodsBySearch(input) {

    const allFood = await getAllFood()
    let results = []
    for (let i = 0; i < allFood.length; i++) {
        let food = allFood[i]
        if (food.namn.toLowerCase().includes(input.trim().toLowerCase())) {
            results.push(food)
        }
    }
    return results
}
function addSearchResults(results) {
    searchResultElement.innerHTML = ""
    if (results.length === 0) {
        const noSearchResultElement = document.createElement("div")
        noSearchResultElement.textContent = "Inget sökresultat"
        noSearchResultElement.classList.add("food-search-result-div")
        searchResultElement.appendChild(noSearchResultElement)
    }
    for (let i = 0; i < results.length; i++) {
        const food = results[i];

        const resultElement = document.createElement("div");
        resultElement.classList.add("food-search-result-div");


        const text = document.createElement("span");
        text.textContent = food.namn;

        const addBtn = document.createElement("button")
        addBtn.dataset.food = food

        addBtn.addEventListener("click", function () {
            onAddFoodClicked(food);
        });

        const img = document.createElement("img");
        img.src = "../imgs/x-thin.svg";
        img.alt = "En bild på ett plus tecken"
        img.classList.add("food-search-img");
        addBtn.appendChild(img)


        resultElement.appendChild(text);
        resultElement.appendChild(addBtn);


        searchResultElement.appendChild(resultElement);
    }
}
async function onSearchClicked() {
    const input = searchInputElement.value
    if (input.length <= 0) {
        searchResultElement.innerHTML = ""
        const noSearchResultElement = document.createElement("div")
        noSearchResultElement.textContent = "Du måste skriva något"
        noSearchResultElement.classList.add("food-search-result-div")
        searchResultElement.appendChild(noSearchResultElement)
        return
    }
    const results = await getFoodsBySearch(input)
    const sortedResult = sortResult(results, input)
    addSearchResults(sortedResult)

}
function sortResult(result, searchWord) {
    result.sort((a, b) => {
        const search = searchWord.trim().toLowerCase()

        const aName = a.namn.toLowerCase()
        const bName = b.namn.toLowerCase()

        const aStarts = aName.startsWith(search)
        const bStarts = bName.startsWith(search)

        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1

        return aName.length - bName.length
    });

    return result
}
function toggleFoodSearchDiv() {
    searchResultElement.innerHTML = ""
    searchInputElement.value = ""
    foodSearchDiv.classList.toggle("deactive")
}
async function onAddFoodClicked(food) {
    toggleFoodSearchDiv();
    const alreadyExists = selectedFoodsInfo.some(
        f => f.meta.nummer === food.nummer
    );
    if(alreadyExists) {
        return
    }
    const nutritionalValues = await getNutritionalValues(food.nummer);

    const data = getSelectedFoodInformation(
        food,
        100,
        nutritionalValues
    );

    const foodInfo = {
        meta: {
            name: food.namn,
            nummer: food.nummer
        },
        grams: 100,
        kcalCalculated: data.kcal.calculated,
        kcalFromAPI: data.kcal.fromAPI
    };

    selectedFoodsInfo.push(foodInfo)

    saveToLocalStorage()
    updateTotals()

    renderFoodDiv(foodInfo)
}
async function renderFoodDiv(foodInfo) {
    const nutritionalValues = await getNutritionalValues(foodInfo.meta.nummer);

    const data = getSelectedFoodInformation(
        {
            namn: foodInfo.meta.name,
            nummer: foodInfo.meta.nummer
        },
        foodInfo.grams,
        nutritionalValues
    );

    const id = `selected-food-${foodInfo.meta.nummer}`;

    const htmlToAdd = `
    <div id="${id}">
        <h3>${foodInfo.meta.name}</h3>

        <input type="range" min="0" max="500" value="${foodInfo.grams}" class="slider">
        <span class="grams">${foodInfo.grams} g</span>
        

        <span>Kolhydrat: <span class="carbs">${data.carbohydrates.varde.toFixed(2)}</span></span>
        <span>Protein: <span class="protein">${data.protein.varde.toFixed(2)}</span></span>
        <span>Fett: <span class="fat">${data.fat.varde.toFixed(2)}</span></span>

        <span>Beräknad kcal: <span class="kcalCalc">${data.kcal.calculated.toFixed(2)}</span></span>
        <span>Kcal från livsmedelverket: <span class="kcalAPI">${data.kcal.fromAPI.toFixed(2)}</span></span>
        <button class="remove-button">Ta bort</button>
    </div>
    `;

    selectedFoodDiv.insertAdjacentHTML("beforeend", htmlToAdd);

    const container = document.getElementById(id);
    const slider = container.querySelector(".slider");
    const removeBtn = container.querySelector(".remove-button")
    removeBtn.addEventListener("click", () => {
        const index = selectedFoodsInfo.findIndex(
            f => f.meta.nummer === foodInfo.meta.nummer
        );

        if (index !== -1) {
            selectedFoodsInfo.splice(index, 1)
        }

        saveToLocalStorage()
        updateTotals()
        container.remove()
    })
    slider.addEventListener("input", (e) => {
        const grams = Number(e.target.value)

        container.querySelector(".grams").textContent = grams + " g";

        const newData = getSelectedFoodInformation(
            { namn: foodInfo.meta.name, nummer: foodInfo.meta.nummer },
            grams,
            nutritionalValues
        );

        const index = selectedFoodsInfo.findIndex(
            f => f.meta.nummer === foodInfo.meta.nummer
        );

        if (index !== -1) {
            selectedFoodsInfo[index].grams = grams;
        }

        saveToLocalStorage()
        
        updateTotals()
        container.querySelector(".carbs").textContent = newData.carbohydrates.varde.toFixed(2)
        container.querySelector(".protein").textContent = newData.protein.varde.toFixed(2)
        container.querySelector(".fat").textContent = newData.fat.varde.toFixed(2)

        container.querySelector(".kcalCalc").textContent = newData.kcal.calculated.toFixed(2)
        container.querySelector(".kcalAPI").textContent = newData.kcal.fromAPI.toFixed(2)
    });
}

function getSelectedFoodInformation(food, amountInGrams, nutritionalValues) {

    const carbohydratesObject = nutritionalValues.find(item => item.euroFIRkod === "CHO")
    const proteinObject = nutritionalValues.find(item => item.euroFIRkod === "PROT")
    const fatObject = nutritionalValues.find(item => item.euroFIRkod === "FAT")
    const kcalObject = nutritionalValues.find(item => item.euroFIRkod === "ENERC" && item.enhet === "kcal")

    const factor = amountInGrams / 100

    const carbs = (carbohydratesObject?.varde || 0) * factor
    const protein = (proteinObject?.varde || 0) * factor
    const fat = (fatObject?.varde || 0) * factor

    const kcalCalculated =
        (carbs * 4) +
        (protein * 4) +
        (fat * 9)

    const kcalFromAPI = (kcalObject?.varde || 0) * factor

    return {
        meta: {
            name: food.namn,
            nummer: food.nummer
        },
        carbohydrates: {
            varde: carbs,
            kcal: carbs * 4
        },
        protein: {
            varde: protein,
            kcal: protein * 4
        },
        fat: {
            varde: fat,
            kcal: fat * 9
        },
        kcal: {
            calculated: kcalCalculated,
            fromAPI: kcalFromAPI
        }
    }
}
function saveToLocalStorage() {
    const allData = loadFromLocalStorage()

    allData[pageDate] = selectedFoodsInfo

    localStorage.setItem("foodDataByDate", JSON.stringify(allData))
}
function loadFromLocalStorage() {
    const data = localStorage.getItem("foodDataByDate")
    return data ? JSON.parse(data) : {}
}
function loadFoodsForToday() {
    const allData = loadFromLocalStorage()

    selectedFoodsInfo = allData[pageDate] || []
}
async function renderSavedFoods() {
    const allFood = await getAllFood()

    for (const saved of selectedFoodsInfo) {
        const food = allFood.find(f => f.nummer === saved.meta.nummer)

        if (!food) continue

        renderFoodDiv({
            meta: {
                name: food.namn,
                nummer: food.nummer
            },
            grams: saved.grams
        })
    }
}
function updateTotals() {
    let totalCalc = 0
    let totalApi = 0

    for (const food of selectedFoodsInfo) {

        const factor = food.grams / 100

        totalCalc += food.kcalCalculated * factor
        totalApi += food.kcalFromAPI * factor
    }

    totalKcalCalcEl.textContent = totalCalc.toFixed(2)
    totalKcalApiEl.textContent = totalApi.toFixed(2)
}

parseSafeDate(pageDate)
dayTitleElement.textContent = getDayString()
loadFoodsForToday()
renderSavedFoods()
updateTotals()
