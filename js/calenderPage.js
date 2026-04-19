const prevMonthButton = document.getElementById("prev-month")
const nextMonthButton = document.getElementById("next-month")
const selectedMonthElement = document.getElementById("selected-month")
const calenderDaysElement = document.getElementById("calender-days")
const days = ["söndag","måndag","tisdag","onsdag","torsdag","fredag","lördag"]
prevMonthButton.addEventListener("click", () => setSelectedMonth(new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth() - 1, 1)))
nextMonthButton.addEventListener("click", () => setSelectedMonth(new Date(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth() + 1, 1)))

init()

function init() {
    
    let currentSelectedDate
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    if(dateParam === null) {
        currentSelectedDate = new Date()
        setSelectedMonth(currentSelectedDate)
    } else {
        const [year, month, day] = dateParam.split("-").map(Number);
        currentSelectedDate = new Date(year, month, day);
        if(Number.isNaN(currentSelectedDate.getDate())) {
            currentSelectedDate = new Date()
        }
        setSelectedMonth(currentSelectedDate)
    }
}



function setSelectedMonth(date) {
    currentSelectedDate = date
    let monthName = date.toLocaleString("sv-SE", { month: "long" })
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    const year = date.getFullYear()
    selectedMonthElement.textContent = monthName + " " + year
    updateCalender(date) 
    history.pushState(null, "", `?date=${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
}

function updateCalender(date) {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()


    let startingWeekday = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    //Gör om så att söndag är 6 och måndag 0 istället för söndag 0 och måndag 1
    startingWeekday = (startingWeekday + 6) % 7;

    calenderDaysElement.innerHTML = "";

    for (let i = 0; i < startingWeekday; i++) {
        const empty = document.createElement("div");
        empty.classList.add("calender-day", "empty");
        calenderDaysElement.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
        const calenderCard = getCalenderCard(dayDate);
        calenderDaysElement.appendChild(calenderCard)
        
    }

}
function getCalenderCard(date) {
    const aLink = document.createElement("a")
    const todaysDate = new Date() 
    if( date.getFullYear() === todaysDate.getFullYear() &&
        date.getMonth() === todaysDate.getMonth() &&
        date.getDate() === todaysDate.getDate()) {
        aLink.classList.add("calender-day", "calender-current-day")
    } else {
        aLink.classList.add("calender-day")
    }

    let monthName = date.toLocaleString("sv-SE", { month: "long" })
    aLink.ariaLabel = `${date.getDate()} ${monthName}, redigera livsmedel`
    aLink.href = `/html/foodSelector.html?date=${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

    const h2 = document.createElement("h2")
    h2.textContent = date.getDate()
    const dayKcalInfo = getDayKcalInfo(date)

    const calcKcalElement = document.createElement("span")
    calcKcalElement.classList.add("calc-kcal")
    calcKcalElement.textContent = dayKcalInfo.totalCalculatedKcal.toFixed(2) + " B kcal"
    const apiKcalElement = document.createElement("span")
    apiKcalElement.classList.add("api-kcal")
    apiKcalElement.textContent = dayKcalInfo.totalApiKcal.toFixed(2) + " Lvm kcal"


    aLink.appendChild(h2) 
    if(dayKcalInfo.totalCalculatedKcal > 0 || dayKcalInfo.totalApiKcal > 0) {
        aLink.appendChild(calcKcalElement)
        aLink.appendChild(apiKcalElement)
    }

    return aLink
}
function getDayKcalInfo(date) {
    let totalCalculatedKcal = 0
    let totalApiKcal = 0

    const dayInfo = loadFoodsForDate(formatDate(date))

    for (let i = 0; i < dayInfo.length; i++) {
        const item = dayInfo[i]

        const grams = item.grams || 0

        const calculated = (item.kcalCalculated || 0) * (grams / 100)
        const api = (item.kcalFromAPI || 0) * (grams / 100)

        totalCalculatedKcal += calculated
        totalApiKcal += api
    }

    return { totalCalculatedKcal, totalApiKcal }
}
function formatDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()

    return `${year}-${month}-${day}`
}
function loadFoodsForDate(date) {
    const data = localStorage.getItem("foodDataByDate")

    if (!data) return []

    const parsed = JSON.parse(data)

    return parsed[date] || []
}




