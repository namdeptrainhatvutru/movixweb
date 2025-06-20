// API URLs
const API_URLS = {
  cinemas: "https://682410ae65ba05803398c2c7.mockapi.io/Rap_Chieu",
  customers: "https://67ac56315853dfff53da3fd1.mockapi.io/Khach_Hang",
  movies: "https://67b5f43207ba6e59083f3354.mockapi.io/Phim",
  tickets: "https://68431f28e1347494c31f29ef.mockapi.io/Ve",
  payments: "https://6824075665ba058033989f25.mockapi.io/Thanh_Toan",
}

// Global data storage
const dashboardData = {
  cinemas: [],
  customers: [],
  movies: [],
  tickets: [],
  payments: [],
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎬 Cinema Dashboard Loading...")
  await loadAllData()

  // Setup event listeners for date filtering
  document.getElementById("dateRange")?.addEventListener("change", function () {
    const selectedRange = this.value
    console.log("Date range changed:", selectedRange)

    // Filter data based on selected range
    filterDataByDateRange(selectedRange)
  })
})

// Load all data from APIs
async function loadAllData() {
  try {
    console.log("📡 Loading data from APIs...")

    // Load data from all APIs
    const results = await Promise.allSettled([
      fetchData("cinemas", API_URLS.cinemas),
      fetchData("customers", API_URLS.customers),
      fetchData("movies", API_URLS.movies),
      fetchData("tickets", API_URLS.tickets),
      fetchData("payments", API_URLS.payments),
    ])

    // Process results
    let successCount = 0
    results.forEach((result, index) => {
      const keys = ["cinemas", "customers", "movies", "tickets", "payments"]
      const key = keys[index]

      if (result.status === "fulfilled") {
        dashboardData[key] = result.value
        successCount++
        console.log(`✅ ${key}: ${result.value.length} items loaded`)
      } else {
        console.error(`❌ ${key} failed:`, result.reason)
        dashboardData[key] = [] // Keep empty array for failed requests
      }
    })

    console.log(`📊 Loaded ${successCount}/5 APIs successfully`)
    console.log("Final data:", dashboardData)

    // Update dashboard with loaded data
    updateDashboard()
  } catch (error) {
    console.error("💥 Error loading data:", error)
    showError("Không thể tải dữ liệu từ server")
  }
}

// Fetch data from API
async function fetchData(name, url) {
  console.log(`📡 Fetching ${name} from ${url}`)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: "cors",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ ${name}: Loaded ${data.length} items`)
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Timeout - API không phản hồi")
    }
    throw new Error(`Không thể kết nối - ${error.message}`)
  }
}

// Update entire dashboard
function updateDashboard() {
  console.log("🔄 Updating dashboard...")
  updateStatsCards()
  updateCharts()
  updateTables()
  updateRecentTransactions()
  console.log("✅ Dashboard updated!")
}

// Update stats cards
function updateStatsCards() {
  const { tickets, payments, movies, customers } = dashboardData

  console.log("📊 Updating stats cards...")

  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => {
    return sum + (Number.parseFloat(payment.so_tien) || 0)
  }, 0)

  document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue)
  document.getElementById("totalTickets").textContent = tickets.length.toLocaleString()
  document.getElementById("totalMovies").textContent = movies.length.toLocaleString()
  document.getElementById("totalCustomers").textContent = customers.length.toLocaleString()

  // Calculate change percentages (mock for now)
  document.getElementById("revenueChange").textContent = "+12.5%"
  document.getElementById("ticketsChange").textContent = "+8.3%"
  document.getElementById("moviesChange").textContent = "0%"
  document.getElementById("customersChange").textContent = "+15.2%"
}

// Update charts
function updateCharts() {
  console.log("📈 Updating charts...")
  updateRevenueChart()
  updateMoviesChart()
}

// Update revenue chart
function updateRevenueChart() {
  const chartContainer = document.getElementById("revenueChart")
  const revenueData = generateRevenueByDate()

  chartContainer.innerHTML = ""

  if (revenueData.data.length === 0) {
    chartContainer.innerHTML = '<div class="loading-chart">Không có dữ liệu doanh thu</div>'
    return
  }

  const maxValue = Math.max(...revenueData.data)

  revenueData.data.forEach((value, index) => {
    const bar = document.createElement("div")
    bar.className = "chart-bar"
    bar.style.height = `${maxValue > 0 ? (value / maxValue) * 200 : 0}px`
    bar.title = `${revenueData.labels[index]}: ${formatCurrency(value)}`

    const label = document.createElement("span")
    label.className = "bar-label"
    label.textContent = revenueData.labels[index]
    bar.appendChild(label)

    chartContainer.appendChild(bar)
  })
}

// Update movies chart
function updateMoviesChart() {
  const chartContainer = document.getElementById("moviesChart")
  const movieStats = getMovieStats()

  chartContainer.innerHTML = ""

  if (movieStats.length === 0) {
    chartContainer.innerHTML = '<div class="loading-chart">Không có dữ liệu phim</div>'
    return
  }

  movieStats.forEach((movie) => {
    const item = document.createElement("div")
    item.className = "movie-item"
    item.innerHTML = `
      <div class="movie-info">
        <h4>${movie.name}</h4>
        <p>Thể loại: ${movie.genre}</p>
      </div>
      <div class="movie-count">${movie.count} vé</div>
    `
    chartContainer.appendChild(item)
  })
}

// Update tables
function updateTables() {
  console.log("📋 Updating tables...")
  updateTopMoviesTable()
  updateCinemaStatsTable()
}

// Update top movies table
function updateTopMoviesTable() {
  const movieStats = getDetailedMovieStats()
  const tbody = document.querySelector("#topMoviesTable tbody")

  tbody.innerHTML = ""

  if (movieStats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
          Không có dữ liệu phim
        </td>
      </tr>
    `
    return
  }

  movieStats.forEach((movie, index) => {
    const row = document.createElement("tr")
    const rankClass = index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "other"

    row.innerHTML = `
      <td><div class="rank ${rankClass}">${index + 1}</div></td>
      <td><strong>${movie.name}</strong></td>
      <td><span class="genre-tag">${movie.genre}</span></td>
      <td><strong>${movie.tickets}</strong></td>
      <td><strong class="revenue-text">${formatCurrency(movie.revenue)}</strong></td>
    `

    tbody.appendChild(row)
  })
}

// Update cinema stats table
function updateCinemaStatsTable() {
  const cinemaStats = getCinemaStats()
  const tbody = document.querySelector("#cinemaStatsTable tbody")

  tbody.innerHTML = ""

  if (cinemaStats.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
          Không có dữ liệu rạp chiếu
        </td>
      </tr>
    `
    return
  }

  cinemaStats.forEach((cinema) => {
    const row = document.createElement("tr")
    row.innerHTML = `
      <td><strong>${cinema.name}</strong></td>
      <td>${cinema.address}</td>
      <td><strong>${cinema.tickets}</strong></td>
      <td><strong class="revenue-text">${formatCurrency(cinema.revenue)}</strong></td>
    `
    tbody.appendChild(row)
  })
}

// Update recent transactions
function updateRecentTransactions() {
  const recentTransactions = getRecentTransactions()
  const container = document.getElementById("recentTransactions")

  container.innerHTML = ""

  if (recentTransactions.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Không có giao dịch nào</div>'
    return
  }

  recentTransactions.forEach((transaction) => {
    const item = document.createElement("div")
    item.className = "transaction-item"

    item.innerHTML = `
      <div class="transaction-info">
        <div class="transaction-avatar">
          ${transaction.customerName.charAt(0).toUpperCase()}
        </div>
        <div class="transaction-details">
          <h4>${transaction.movieName}</h4>
          <p>${transaction.customerName} • ${transaction.date} • ${transaction.cinema}</p>
        </div>
      </div>
      <div class="transaction-amount">
        ${formatCurrency(transaction.amount)}
      </div>
    `

    container.appendChild(item)
  })
}

// Get movie statistics
function getMovieStats() {
  const { tickets, movies } = dashboardData

  if (!tickets || tickets.length === 0) {
    return []
  }

  const movieCounts = {}
  tickets.forEach((ticket) => {
    const movieName = ticket.ten_phim || "Unknown"
    movieCounts[movieName] = (movieCounts[movieName] || 0) + 1
  })

  const movieStats = Object.entries(movieCounts).map(([name, count]) => {
    // Find movie by exact name match
    const movie = movies.find((m) => m.ten_phim === name)
    return {
      name,
      count,
      genre: movie ? movie.the_loai : "Chưa xác định",
    }
  })

  return movieStats.sort((a, b) => b.count - a.count).slice(0, 6)
}

// Get detailed movie statistics
function getDetailedMovieStats() {
  const { tickets, payments, movies } = dashboardData

  if (!tickets || tickets.length === 0) {
    return []
  }

  const movieStats = {}

  // Count tickets and calculate revenue for each movie
  tickets.forEach((ticket) => {
    const movieName = ticket.ten_phim || "Unknown"
    if (!movieStats[movieName]) {
      // Find movie by exact name match
      const movie = movies.find((m) => m.ten_phim === movieName)
      movieStats[movieName] = {
        name: movieName,
        tickets: 0,
        revenue: 0,
        genre: movie ? movie.the_loai : "Chưa xác định",
      }
    }
    movieStats[movieName].tickets++

    // Find corresponding payment
    const payment = payments.find((p) => p.ve_id === ticket.ve_id)
    if (payment) {
      movieStats[movieName].revenue += Number.parseFloat(payment.so_tien) || 0
    }
  })

  return Object.values(movieStats)
    .sort((a, b) => b.tickets - a.tickets)
    .slice(0, 10)
}

// Get cinema statistics
function getCinemaStats() {
  const { tickets, payments, cinemas } = dashboardData

  if (!cinemas || cinemas.length === 0) {
    return []
  }

  const cinemaStats = {}

  // Initialize cinema stats
  cinemas.forEach((cinema) => {
    const key = cinema.dia_chi || cinema.ten_rap
    cinemaStats[key] = {
      name: cinema.ten_rap,
      address: cinema.dia_chi,
      tickets: 0,
      revenue: 0,
    }
  })

  // Count tickets and revenue by cinema
  tickets.forEach((ticket) => {
    const address = ticket.dia_chi_rap
    if (cinemaStats[address]) {
      cinemaStats[address].tickets++

      // Find corresponding payment
      const payment = payments.find((p) => p.ve_id === ticket.ve_id)
      if (payment) {
        cinemaStats[address].revenue += Number.parseFloat(payment.so_tien) || 0
      }
    }
  })

  return Object.values(cinemaStats).sort((a, b) => b.revenue - a.revenue)
}

// Get recent transactions
function getRecentTransactions() {
  const { payments, tickets, customers } = dashboardData

  if (!payments || payments.length === 0) {
    return []
  }

  const transactions = payments.map((payment) => {
    const ticket = tickets.find((t) => t.ve_id === payment.ve_id)
    const customer = customers.find((c) => c.khach_hang_id === payment.khach_hang_id)

    return {
      customerName: customer ? customer.ho_ten : "Khách hàng",
      movieName: ticket ? ticket.ten_phim : "Phim",
      cinema: ticket ? ticket.dia_chi_rap : "Rạp chiếu",
      date: payment.ngay_mua || "Ngày không xác định",
      amount: Number.parseFloat(payment.so_tien) || 0,
      rawDate: payment.ngay_mua, // Keep for sorting
    }
  })

  // Sort by date (dd/mm/yyyy format)
  transactions.sort((a, b) => {
    if (!a.rawDate || !b.rawDate) return 0

    const [dayA, monthA, yearA] = a.rawDate.split("/").map(Number)
    const [dayB, monthB, yearB] = b.rawDate.split("/").map(Number)

    const dateA = new Date(yearA, monthA - 1, dayA)
    const dateB = new Date(yearB, monthB - 1, dayB)

    return dateB - dateA // Most recent first
  })

  return transactions.slice(0, 10)
}

// Generate revenue by date using real payment data
function generateRevenueByDate() {
  const { payments } = dashboardData

  if (!payments || payments.length === 0) {
    return {
      labels: ["Không có dữ liệu"],
      data: [0],
    }
  }

  // Group payments by date
  const revenueByDate = {}

  payments.forEach((payment) => {
    const dateStr = payment.ngay_mua || ""
    if (dateStr) {
      // Convert dd/mm/yyyy to display format
      const [day, month, year] = dateStr.split("/")
      const displayDate = `${day}/${month}`

      if (!revenueByDate[displayDate]) {
        revenueByDate[displayDate] = 0
      }
      revenueByDate[displayDate] += Number.parseFloat(payment.so_tien) || 0
    }
  })

  // Sort dates and get recent ones
  const sortedDates = Object.keys(revenueByDate).sort((a, b) => {
    const [dayA, monthA] = a.split("/").map(Number)
    const [dayB, monthB] = b.split("/").map(Number)

    if (monthA !== monthB) return monthA - monthB
    return dayA - dayB
  })

  // Get last 7 dates or all available dates
  const recentDates = sortedDates.slice(-7)

  return {
    labels: recentDates,
    data: recentDates.map((date) => revenueByDate[date] || 0),
  }
}

// Filter data by date range
function filterDataByDateRange(range) {
  const { payments } = dashboardData

  if (!payments || payments.length === 0) return

  let filteredPayments = [...payments]
  const today = new Date()

  if (range !== "all") {
    filteredPayments = payments.filter((payment) => {
      if (!payment.ngay_mua) return false

      const [day, month, year] = payment.ngay_mua.split("/").map(Number)
      const paymentDate = new Date(year, month - 1, day)

      switch (range) {
        case "today":
          return (
            paymentDate.getDate() === today.getDate() &&
            paymentDate.getMonth() === today.getMonth() &&
            paymentDate.getFullYear() === today.getFullYear()
          )
        case "week":
          const weekAgo = new Date(today)
          weekAgo.setDate(today.getDate() - 7)
          return paymentDate >= weekAgo
        case "month":
          return paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear()
        default:
          return true
      }
    })
  }

  // Update dashboard with filtered data
  const originalPayments = dashboardData.payments
  dashboardData.payments = filteredPayments

  updateStatsCards()
  updateRevenueChart()
  updateRecentTransactions()

  // Restore original data
  dashboardData.payments = originalPayments
}

// Show error message
function showError(message) {
  const statsCards = document.querySelectorAll(".stat-value")
  statsCards.forEach((card) => {
    card.textContent = "Lỗi"
  })

  const charts = document.querySelectorAll(".simple-chart, .movie-stats")
  charts.forEach((chart) => {
    chart.innerHTML = `<div class="loading-chart" style="color: #f44336;">${message}</div>`
  })

  console.error("Dashboard Error:", message)
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0)
}

console.log("🎬 Cinema Dashboard Script Ready!")
