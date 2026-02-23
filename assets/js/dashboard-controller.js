// Dashboard Data Controller
class DashboardController {
    // Fetch and display overdue balance for the first tenant (example)
    async displayOverdueBalance() {
      if (!this.tenants.length) return;
      const tenant = this.tenants[0]; // Example: show for first tenant
      const today = new Date().toISOString().split('T')[0];
      try {
        const result = await api.getOverdueBalance(tenant._id || tenant.id, today);
        const overdue = result.data?.overdueBalance || 0;
        let el = document.getElementById('dashboardOverdueBalance');
        if (!el) {
          el = document.createElement('div');
          el.id = 'dashboardOverdueBalance';
          el.className = 'alert alert-danger mt-3';
          const dash = document.querySelector('.dashboard-header, .dashboard-title, .card-title.text-primary') || document.body;
          dash.parentNode.insertBefore(el, dash.nextSibling);
        }
        el.innerHTML = `<strong>Overdue Balance (as of today):</strong> $${overdue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      } catch (e) {
        console.error('Failed to fetch overdue balance', e);
      }
    }
  constructor() {
    this.properties = [];
    this.suites = [];
    this.tenants = [];
    this.payments = [];
    this.maintenance = [];
  }

  async init() {
    try {
      await this.loadAllData();
      this.updateDashboard();
      await this.displayOverdueBalance();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      this.showError('Failed to load dashboard data. Please ensure backend is running on http://localhost:5000');
    }
  }

  async loadAllData() {
    try {
      const [propertiesRes, suitesRes, tenantsRes, paymentsRes, maintenanceRes] = await Promise.all([
        api.getProperties(),
        api.getSuites(),
        api.getTenants(),
        api.getPayments(),
        api.getMaintenance()
      ]);

      this.properties = Array.isArray(propertiesRes.data) ? propertiesRes.data : (propertiesRes.data ? [propertiesRes.data] : (Array.isArray(propertiesRes) ? propertiesRes : []));
      this.suites = Array.isArray(suitesRes.data) ? suitesRes.data : (suitesRes.data ? [suitesRes.data] : (Array.isArray(suitesRes) ? suitesRes : []));
      this.tenants = Array.isArray(tenantsRes.data) ? tenantsRes.data : (tenantsRes.data ? [tenantsRes.data] : (Array.isArray(tenantsRes) ? tenantsRes : []));
      this.payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : (paymentsRes.data ? [paymentsRes.data] : (Array.isArray(paymentsRes) ? paymentsRes : []));
      this.maintenance = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : (maintenanceRes.data ? [maintenanceRes.data] : (Array.isArray(maintenanceRes) ? maintenanceRes : []));

      console.log('Loaded data:', {
        properties: this.properties.length,
        suites: this.suites.length,
        tenants: this.tenants.length,
        payments: this.payments.length,
        maintenance: this.maintenance.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  updateDashboard() {
    this.updateMetrics();
    this.updatePropertyStats();
    this.updateRecentPayments();
    this.updateWelcomeCard();
    this.updateTenantPayments();
    this.updateIncomeStats();
    console.log('Dashboard updated successfully');
  }

  updateWelcomeCard() {
    // Update welcome message with accurate data
    const occupiedCount = this.properties.filter(p => p.status === 'occupied').length;
    const totalProperties = this.properties.length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
    const pendingPayments = this.payments.filter(p => p.status === 'pending').length;

    const welcomeCard = document.querySelector('.card-title.text-primary');
    if (welcomeCard) {
      welcomeCard.textContent = 'Welcome to Rent Management! 🏠';
    }

    const welcomeText = document.querySelector('.card-body p.mb-4');
    if (welcomeText) {
      welcomeText.innerHTML = `
        You have <span class="fw-bold">${totalProperties}</span> active properties with <span class="fw-bold">${occupancyRate}%</span> occupancy rate. 
        <span class="fw-bold">${pendingPayments}</span> rent payment${pendingPayments !== 1 ? 's are' : ' is'} due this week.
      `;
    }
  }

  updateMetrics() {
    // Total Properties
    const totalProperties = this.properties.length;
    const occupiedProperties = this.properties.filter(p => p.status === 'occupied').length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

    // Monthly Revenue - Sum of all occupied property rents
    const monthlyRevenue = this.properties
      .filter(p => p.status === 'occupied')
      .reduce((sum, p) => sum + (parseFloat(p.rent) || 0), 0);

    // Pending Payments
    const pendingPayments = this.payments.filter(p => p.status === 'pending');
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Maintenance Requests
    const openMaintenance = this.maintenance.filter(m => m.status === 'open').length;
    const totalMaintenance = this.maintenance.length;

    // Update Total Properties Card
    const cards = document.querySelectorAll('.card-body');
    cards.forEach(card => {
      const title = card.querySelector('span.fw-semibold.d-block.mb-1');
      const value = card.querySelector('h3.card-title.mb-2');
      
      if (title && value) {
        if (title.textContent === 'Total Properties') {
          value.textContent = totalProperties;
          const trend = card.querySelector('small');
          if (trend) {
            const increase = totalProperties > 0 ? 8.3 : 0;
            trend.innerHTML = `<i class="bx bx-up-arrow-alt"></i> +${increase}%`;
          }
        }
        
        if (title.textContent === 'Monthly Revenue') {
          value.textContent = `$${monthlyRevenue.toLocaleString()}`;
          const trend = card.querySelector('small');
          if (trend) {
            trend.innerHTML = `<i class="bx bx-up-arrow-alt"></i> +12.8%`;
          }
        }
      }

      // Pending Payments Card
      const pendingTitle = card.querySelector('span.d-block.mb-1');
      if (pendingTitle && pendingTitle.textContent === 'Pending Payments') {
        const pendingValue = card.querySelector('h3.card-title.text-nowrap.mb-2');
        if (pendingValue) {
          pendingValue.textContent = `$${pendingAmount.toLocaleString()}`;
        }
        const pendingSmall = card.querySelector('small');
        if (pendingSmall) {
          pendingSmall.className = 'text-warning fw-semibold';
          pendingSmall.innerHTML = `<i class="bx bx-time"></i> ${pendingPayments.length} Due`;
        }
      }

      // Maintenance Requests Card
      const maintenanceTitle = card.querySelector('span.fw-semibold.d-block.mb-1');
      if (maintenanceTitle && maintenanceTitle.textContent === 'Maintenance Requests') {
        const maintenanceValue = card.querySelector('h3.card-title.mb-2');
        if (maintenanceValue) {
          maintenanceValue.textContent = totalMaintenance;
        }
        const maintenanceSmall = card.querySelector('small');
        if (maintenanceSmall) {
          maintenanceSmall.className = 'text-info fw-semibold';
          maintenanceSmall.innerHTML = `<i class="bx bx-wrench"></i> ${openMaintenance} Open`;
        }
      }
    });

    // Update occupancy rate text
    const occupancyEl = document.querySelector('.text-center.fw-semibold.pt-3.mb-2');
    if (occupancyEl) {
      occupancyEl.textContent = `${occupancyRate}% Occupancy Rate`;
    }

    // Update Lease Report
    const leaseReport = document.querySelectorAll('.card-title h5');
    leaseReport.forEach(h5 => {
      if (h5.textContent.includes('Lease Report')) {
        const parent = h5.closest('.card-body');
        if (parent) {
          const activeCount = parent.querySelector('h3.mb-0');
          if (activeCount) {
            activeCount.textContent = `${occupiedProperties} Active`;
          }
          const percentage = parent.querySelector('small.text-success');
          if (percentage) {
            percentage.innerHTML = `<i class="bx bx-chevron-up"></i> ${occupancyRate}%`;
          }
        }
      }
    });
  }

  updatePropertyStats() {
    const totalCount = this.properties.length;
    const vacantCount = this.properties.filter(p => p.status === 'vacant').length;
    const maintenanceCount = this.properties.filter(p => p.status === 'maintenance').length;
    const occupiedCount = Math.max(totalCount - vacantCount - maintenanceCount, 0);

    // Update the statistics in the Property Statistics card
    const statsCard = Array.from(document.querySelectorAll('.card-header')).find(
      header => header.textContent.includes('Property Statistics')
    );

    if (statsCard) {
      const card = statsCard.closest('.card');
      const totalText = statsCard.querySelector('small');
      if (totalText) {
        totalText.textContent = `${this.properties.length} Total Properties`;
      }

      const totalHeader = card.querySelector('h2.mb-2');
      if (totalHeader) {
        totalHeader.textContent = totalCount;
      }

      const items = card.querySelectorAll('li .user-progress small.fw-semibold');
      if (items.length >= 4) {
        items[0].textContent = occupiedCount;
        items[1].textContent = vacantCount;
        items[2].textContent = maintenanceCount;
        items[3].textContent = totalCount;
      }
    }
  }

  updateRecentPayments() {
    const paymentsContainer = document.querySelector('.col-md-6.col-lg-4.order-2 .card-body ul');
    if (!paymentsContainer) return;

    paymentsContainer.innerHTML = '';

    // Sort payments by date (most recent first) and get recent 6
    const sortedPayments = [...this.payments].sort((a, b) => {
      return new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt);
    });
    const recentPayments = sortedPayments.slice(0, 6);

    if (recentPayments.length === 0) {
      paymentsContainer.innerHTML = '<li class="text-center p-3 text-muted"><i class="bx bx-receipt bx-sm d-block mb-2"></i>No payment records yet</li>';
      return;
    }

    recentPayments.forEach((payment, index) => {
      // Use populated tenant/compartment if available from backend
      let tenantName = 'Unknown Tenant';
      if (payment.tenant && (payment.tenant.firstName || payment.tenant.lastName)) {
        tenantName = `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim();
      } else if (payment.tenant && payment.tenant.name) {
        tenantName = payment.tenant.name;
      }
      let compartmentName = 'Unknown Compartment';
      if (payment.compartment && payment.compartment.compartmentNumber) {
        compartmentName = payment.compartment.compartmentNumber;
      } else if (payment.compartmentNumber) {
        compartmentName = payment.compartmentNumber;
      }

      const li = document.createElement('li');
      li.className = index === recentPayments.length - 1 ? 'd-flex' : 'd-flex mb-4 pb-1';

      const amount = parseFloat(payment.amount || 0);
      const expectedAmount = parseFloat(payment.expectedAmount || payment.amount || 0);
      const difference = payment.difference || (amount - expectedAmount);

      // Determine payment type and styling
      let statusClass = 'text-success';
      let paymentBadge = '';
      let amountDisplay = `+$${amount.toFixed(2)}`;

      if (payment.paymentType === 'partial') {
        statusClass = 'text-warning';
        paymentBadge = '<span class="badge bg-label-warning ms-1" style="font-size: 0.7rem;">Partial</span>';
      } else if (payment.paymentType === 'overpayment') {
        statusClass = 'text-info';
        paymentBadge = '<span class="badge bg-label-info ms-1" style="font-size: 0.7rem;">+Credit</span>';
      } else {
        paymentBadge = '<span class="badge bg-label-success ms-1" style="font-size: 0.7rem;">Full</span>';
      }

      const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';

      li.innerHTML = `
        <div class="avatar flex-shrink-0 me-3">
          <span class="avatar-initial rounded bg-label-success">
            <i class="bx bx-dollar"></i>
          </span>
        </div>
        <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
          <div class="me-2">
            <small class="text-muted d-block mb-1">${compartmentName} • ${paymentDate}</small>
            <h6 class="mb-0">${tenantName}</h6>
            ${difference !== 0 ? `<small class="text-muted">Expected: $${expectedAmount.toFixed(2)} • Diff: ${difference > 0 ? '+' : ''}$${difference.toFixed(2)}</small>` : ''}
          </div>
          <div class="user-progress d-flex align-items-center gap-1">
            <h6 class="mb-0 ${statusClass}">${amountDisplay}</h6>
            ${paymentBadge}
          </div>
        </div>
      `;

      paymentsContainer.appendChild(li);
    });
  }

  updateIncomeStats() {
    // Calculate collected payments (completed this month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const collectedPayments = this.payments.filter(p => {
      if (p.status !== 'completed') return false;
      const paymentDate = new Date(p.paymentDate || p.createdAt);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const collectedAmount = collectedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    // Calculate pending payments (tenants with balance > 0 or pending status)
    const pendingTenants = this.tenants.filter(t => {
      const balance = parseFloat(t.balance) || 0;
      return balance > 0 || t.paymentStatus === 'pending';
    });
    
    const pendingAmount = pendingTenants.reduce((sum, t) => {
      const balance = parseFloat(t.balance) || 0;
      return sum + (balance > 0 ? balance : parseFloat(t.rent) || 0);
    }, 0);
    
    // Calculate overdue tenants
    const overdueTenants = this.tenants.filter(t => {
      if (!t.moveInDate) return false;
      const moveIn = new Date(t.moveInDate);
      const dayOfMonth = moveIn.getDate();
      let dueDate = new Date(currentYear, currentMonth, dayOfMonth);
      if (dueDate > now) {
        dueDate = new Date(currentYear, currentMonth - 1, dayOfMonth);
      }
      const balance = parseFloat(t.balance) || 0;
      return now > dueDate && (balance > 0 || t.paymentStatus === 'pending');
    });
    
    const overdueAmount = overdueTenants.reduce((sum, t) => {
      const balance = parseFloat(t.balance) || 0;
      return sum + (balance > 0 ? balance : parseFloat(t.rent) || 0);
    }, 0);
    
    // Calculate percentage (collected vs expected monthly rent)
    const totalExpectedRent = this.tenants.reduce((sum, t) => sum + (parseFloat(t.rent) || 0), 0);
    const collectionRate = totalExpectedRent > 0 ? Math.round((collectedAmount / totalExpectedRent) * 100) : 0;
    
    // Update Collected tab
    const collectedAmountEl = document.getElementById('collectedAmount');
    if (collectedAmountEl) {
      collectedAmountEl.textContent = `$${collectedAmount.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
    }
    
    const collectedPercentageEl = document.getElementById('collectedPercentage');
    if (collectedPercentageEl) {
      const icon = collectionRate >= 80 ? 'bx-chevron-up' : 'bx-chevron-down';
      const colorClass = collectionRate >= 80 ? 'text-success' : 'text-danger';
      collectedPercentageEl.className = `${colorClass} fw-semibold`;
      collectedPercentageEl.innerHTML = `<i class="bx ${icon}"></i> ${collectionRate}%`;
    }
    
    // Update Pending info
    const pendingInfoEl = document.getElementById('pendingInfo');
    if (pendingInfoEl) {
      pendingInfoEl.textContent = `$${pendingAmount.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})} from ${pendingTenants.length} tenant${pendingTenants.length !== 1 ? 's' : ''}`;
    }
    
    // Update/Initialize Income Chart
    this.initializeIncomeChart();
    
    // Update/Initialize Pending Donut Chart
    this.initializePendingChart(pendingAmount, totalExpectedRent);
  }

  initializeIncomeChart() {
    // Get payment history starting from January 2026
    const monthlyData = [];
    const monthLabels = [];
    const startDate = new Date(2026, 0, 1); // January 2026
    const now = new Date();
    
    // Calculate number of months from Jan 2026 to current month
    const monthsToShow = Math.min(7, (now.getFullYear() - 2026) * 12 + (now.getMonth() - 0) + 1);
    
    for (let i = 0; i < monthsToShow; i++) {
      const targetDate = new Date(2026, 0 + i, 1); // Start from January 2026
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      const monthPayments = this.payments.filter(p => {
        if (p.status !== 'completed') return false;
        const paymentDate = new Date(p.paymentDate || p.createdAt);
        return paymentDate.getMonth() === targetMonth && paymentDate.getFullYear() === targetYear;
      });
      
      const monthTotal = monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      monthlyData.push(monthTotal);
      
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      monthLabels.push(monthName);
    }
    
    const chartEl = document.getElementById('incomeChart');
    if (!chartEl) return;
    
    // Clear existing chart
    chartEl.innerHTML = '';
    
    const maxValue = Math.max(...monthlyData, 100);
    
    const options = {
      series: [{
        name: 'Rent Collected',
        data: monthlyData
      }],
      chart: {
        height: 215,
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.25,
          stops: [0, 95, 100]
        }
      },
      grid: {
        borderColor: '#eceef1',
        strokeDashArray: 3
      },
      xaxis: {
        categories: monthLabels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#a1acb8',
            fontSize: '13px'
          }
        }
      },
      yaxis: {
        show: false,
        min: 0,
        max: maxValue * 1.1
      },
      colors: ['#696cff'],
      markers: {
        size: 6,
        colors: '#ffffff',
        strokeColors: '#696cff',
        strokeWidth: 4,
        hover: { size: 7 }
      },
      tooltip: {
        y: {
          formatter: (val) => '$' + val.toFixed(2)
        }
      }
    };
    
    const chart = new ApexCharts(chartEl, options);
    chart.render();
  }

  initializePendingChart(pendingAmount, totalExpectedRent) {
    const pendingPercentage = totalExpectedRent > 0 ? Math.round((pendingAmount / totalExpectedRent) * 100) : 0;
    
    const chartEl = document.getElementById('expensesOfWeek');
    if (!chartEl) return;
    
    // Clear existing chart
    chartEl.innerHTML = '';
    
    const options = {
      series: [pendingPercentage],
      chart: {
        type: 'radialBar',
        width: 60,
        height: 60,
        sparkline: { enabled: true }
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '55%'
          },
          track: {
            background: 'rgba(236,238,241,0.85)'
          },
          dataLabels: {
            name: { show: false },
            value: {
              show: true,
              fontSize: '13px',
              color: '#697a8d',
              offsetY: 5,
              formatter: () => '$' + pendingPercentage
            }
          }
        }
      },
      colors: ['#696cff'],
      stroke: {
        lineCap: 'round'
      }
    };
    
    const chart = new ApexCharts(chartEl, options);
    chart.render();
  }

  updateQuickPropertyActions() {
    const grid = document.getElementById('quickPropertiesGrid');
    if (!grid) return;

    if (this.properties.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-4">
          <i class="bx bx-building bx-lg text-muted mb-3"></i>
          <p class="text-muted mb-0">No properties found</p>
          <a href="properties-add.html" class="btn btn-sm btn-primary mt-2">
            <i class="bx bx-plus me-1"></i> Add Your First Property
          </a>
        </div>
      `;
      return;
    }

    // Show first 6 properties
    const recentProperties = this.properties.slice(0, 6);
    
    grid.innerHTML = recentProperties.map(property => {
      const statusColors = {
        'vacant': 'success',
        'occupied': 'warning',
        'maintenance': 'danger'
      };
      const statusColor = statusColors[property.status?.toLowerCase()] || 'secondary';
      
      return `
        <div class="col-md-6 col-xl-4 mb-3">
          <div class="card shadow-none border">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center">
                  <div class="avatar flex-shrink-0 me-2">
                    <span class="avatar-initial rounded bg-label-${statusColor}">
                      <i class="bx bx-building"></i>
                    </span>
                  </div>
                  <div>
                    <h6 class="mb-0">${property.name}</h6>
                  </div>
                </div>
                <span class="badge bg-label-${statusColor}">${property.status || 'N/A'}</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">
                  <i class="bx bx-bed bx-xs"></i> ${property.bedrooms || 'N/A'} beds
                  <i class="bx bx-bath bx-xs ms-2"></i> ${property.bathrooms || 'N/A'} baths
                </small>
                <span class="fw-bold text-primary">$${property.rent ? property.rent.toLocaleString() : '0'}</span>
              </div>
              <div class="d-flex gap-1 mt-3">
                <a href="properties-edit.html?id=${property._id}" class="btn btn-sm btn-outline-primary flex-grow-1">
                  <i class="bx bx-edit-alt bx-xs"></i> Edit
                </a>
                <button onclick="deleteProperty('${property._id}', '${property.name}')" class="btn btn-sm btn-outline-danger">
                  <i class="bx bx-trash bx-xs"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateTenantPayments() {
    if (!this.tenants || this.tenants.length === 0) {
      console.log('No tenants to display');
      return;
    }

    // Calculate payment statistics
    const totalTenants = this.tenants.length;
    const paidTenants = this.tenants.filter(t => t.paymentStatus === 'paid').length;
    const pendingTenants = this.tenants.filter(t => t.paymentStatus === 'pending').length;
    const overdueTenants = this.tenants.filter(t => t.paymentStatus === 'overdue').length;

    // Update payment stats card
    const statsCard = document.getElementById('tenantPaymentStats');
    if (statsCard) {
      statsCard.innerHTML = `
        <h6 class="mb-3">Rent Collection Status</h6>
        <div class="d-flex justify-content-between mb-2">
          <span>Total Tenants</span>
          <span class="fw-semibold">${totalTenants}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-success">Paid</span>
          <span class="fw-semibold text-success">${paidTenants}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-warning">Pending</span>
          <span class="fw-semibold text-warning">${pendingTenants}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-danger">Overdue</span>
          <span class="fw-semibold text-danger">${overdueTenants}</span>
        </div>
        <div class="mt-3">
          <a href="tenants-list.html" class="btn btn-sm btn-primary w-100">Manage Tenants</a>
        </div>
      `;
    }

    // Update tenants due soon
    const tenantsDueList = document.getElementById('tenantsDueSoon');
    if (tenantsDueList) {
      const tenantsWithDueDates = this.tenants
        .map(tenant => {
          const dueDate = this.calculateNextDueDate(tenant.moveInDate);
          const daysUntil = this.calculateDaysUntilDue(dueDate);
          return { ...tenant, dueDate, daysUntil };
        })
        .filter(t => t.daysUntil >= 0 && t.daysUntil <= 7)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      if (tenantsWithDueDates.length === 0) {
        tenantsDueList.innerHTML = '<p class="text-muted">No rent due in the next 7 days</p>';
      } else {
        tenantsDueList.innerHTML = tenantsWithDueDates.map(tenant => {
          const suite = this.suites.find(s => s._id === tenant.suiteId);
          const property = this.properties.find(p => p._id === tenant.propertyId);
          const propertyName = property ? property.name : 'Unknown Property';
          const suiteNumber = suite ? suite.suiteNumber : 'No Suite';
          const statusColor = tenant.daysUntil <= 2 ? 'danger' : 'warning';
          
          return `
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 class="mb-0">${tenant.name}</h6>
                <small class="text-muted">${propertyName} - ${suiteNumber}</small>
              </div>
              <div class="text-end">
                <div class="fw-semibold">$${parseFloat(tenant.rent || 0).toFixed(2)}</div>
                <small class="badge bg-label-${statusColor}">${tenant.daysUntil === 0 ? 'Today' : `${tenant.daysUntil} days`}</small>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Update overdue payments alert
    const overdueAlert = document.getElementById('overduePaymentsAlert');
    if (overdueAlert && overdueTenants > 0) {
      overdueAlert.style.display = 'block';
      overdueAlert.innerHTML = `
        <div class="alert alert-danger alert-dismissible" role="alert">
          <h6 class="alert-heading mb-1">⚠️ Overdue Payments</h6>
          <span>${overdueTenants} tenant${overdueTenants > 1 ? 's have' : ' has'} overdue rent payments. 
          <a href="tenants-list.html" class="alert-link">Review now</a></span>
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    } else if (overdueAlert) {
      overdueAlert.style.display = 'none';
    }
  }

  calculateNextDueDate(moveInDate) {
    if (!moveInDate) return null;
    
    const moveIn = new Date(moveInDate);
    const dayOfMonth = moveIn.getDate();
    const today = new Date();
    
    let nextDue = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    
    if (nextDue <= today) {
      nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
    }
    
    return nextDue;
  }

  calculateDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  async deleteProperty(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await api.deleteProperty(id);
      if (response.success) {
        alert('Property deleted successfully!');
        await this.init(); // Reload dashboard data
      } else {
        this.showError('Failed to delete property: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      this.showError('Failed to delete property');
    }
  }

  showError(message) {
    console.error(message);
    alert(message);
  }
}

// Global dashboard instance
let dashboardInstance = null;

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  dashboardInstance = new DashboardController();
  await dashboardInstance.init();
  
  // Refresh data every 30 seconds
  setInterval(() => dashboardInstance.init(), 30000);
  
  console.log('Dashboard initialized and auto-refresh enabled');
});

// Global helper function for deleting properties
function deleteProperty(id, name) {
  if (dashboardInstance) {
    dashboardInstance.deleteProperty(id, name);
  } else {
    console.error('Dashboard not initialized');
  }
}
