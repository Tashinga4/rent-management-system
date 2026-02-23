// Utility object to hold dashboard functions
const DashboardUtils = {
  // Determine payment status for a compartment for the current month
  getCompartmentPaymentStatus(compartment, payments) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    if (!compartment.tenant || compartment.status === 'vacant') {
      return { status: 'Vacant', color: 'secondary', paidAmount: 0 };
    }
    const tenantId = compartment.tenant._id || compartment.tenant;
    // Match both tenant and tenantId fields for all payment records
    const thisMonthPayments = payments.filter(p => {
      const pDate = new Date(p.dueDate);
      const match = (p.tenant === tenantId || (p.tenant && p.tenant._id === tenantId) ||
                    p.tenantId === tenantId || (p.tenantId && p.tenantId._id === tenantId));
      return match && pDate >= thisMonth && pDate < nextMonth;
    });
    const paidAmount = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const rent = compartment.rentAmount || 0;
    let status = 'Due';
    let color = 'warning';
    // Determine status based on payment records
    if (thisMonthPayments.length === 0) {
      status = 'Due';
      color = 'warning';
    } else {
      // If any payment is overdue
      if (thisMonthPayments.some(p => p.status === 'overdue')) {
        status = 'Overdue';
        color = 'danger';
      } else if (thisMonthPayments.some(p => p.status === 'partial')) {
        status = 'Partial';
        color = 'secondary';
      } else if (thisMonthPayments.some(p => p.status === 'paid')) {
        if (paidAmount > rent) {
          status = 'Prepaid';
          color = 'primary';
        } else {
          status = 'Paid';
          color = 'success';
        }
      }
    }
    return { status, color, paidAmount };
  },
  // Render compartments table with payment status and paid amount
  renderCompartmentsTable(compartments, payments) {
    const tableBody = document.getElementById('compartmentsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    compartments.forEach(compartment => {
      const { status, color, paidAmount } = this.getCompartmentPaymentStatus(compartment, payments);
      const tenantName = compartment.tenant && compartment.tenant.firstName ? `${compartment.tenant.firstName} ${compartment.tenant.lastName}` : (compartment.status === 'vacant' ? '—' : '-');
      const paymentStatusDisplay = status === 'Vacant' ? '<span class="badge bg-secondary">Vacant</span>' : `<span class="badge bg-${color}">${status}</span>`;
      const paidAmountDisplay = status === 'Vacant' ? '-' : paidAmount;
      const contactDisplay = compartment.tenant && compartment.tenant.phone ? compartment.tenant.phone : (compartment.status === 'vacant' ? '—' : '-');
      const whatsappBtn = (compartment.tenant && compartment.tenant.phone)
        ? `<a href="https://wa.me/${compartment.tenant.phone.replace(/[^\d]/g, '')}" target="_blank" class="btn btn-success btn-sm" title="WhatsApp"><i class="bx bxl-whatsapp"></i></a>`
        : '';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${compartment.compartmentNumber}${compartment.status === 'vacant' ? 'Vacant' : 'Occupied'}</td>
        <td>${tenantName}</td>
        <td>${compartment.rentAmount || ''}</td>
        <td>${paymentStatusDisplay}</td>
        <td>${paidAmountDisplay}</td>
        <td>${contactDisplay}</td>
        <td>${whatsappBtn}</td>
      `;
      tableBody.appendChild(row);
    });
  }
};
// Dashboard Data Manager
class DashboardDataManager {
    // Fetch monthly payment summary from backend
    async fetchPaymentSummary() {
      try {
        const res = await fetch(`${this.apiBase}/payments/summary/monthly`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.success ? data.summary : null;
      } catch (err) {
        console.error('Error fetching payment summary:', err);
        return null;
      }
    }

    // Update dashboard UI with backend summary
    updateDashboardUIWithSummary(summary) {
      if (!summary) return;
      // Payment summary cards (compartments.html IDs)
      const paidEl = document.getElementById('paymentSummaryPaid');
      if (paidEl) paidEl.textContent = summary.paid;
      const overdueEl = document.getElementById('paymentSummaryOverdue');
      if (overdueEl) overdueEl.textContent = summary.overdue;
      const partialEl = document.getElementById('paymentSummaryPartial');
      if (partialEl) partialEl.textContent = summary.partial;
      const upToDateEl = document.getElementById('paymentSummaryUpToDate');
      if (upToDateEl) upToDateEl.textContent = summary.upToDate;
      const paidInAdvanceEl = document.getElementById('paymentSummaryPaidInAdvance');
      if (paidInAdvanceEl) paidInAdvanceEl.textContent = summary.paidInAdvance;
      // Monthly collected
      const monthlyCollectedEl = document.getElementById('monthlyCollected');
      if (monthlyCollectedEl && summary.totalCollected !== undefined) {
        monthlyCollectedEl.textContent = `$${summary.totalCollected.toFixed(2)}`;
      }
      // Optionally update collection percent if available
      const collectionPercentEl = document.getElementById('collectionPercent');
      if (collectionPercentEl && summary.collectionPercent !== undefined) {
        collectionPercentEl.textContent = summary.collectionPercent;
      }
    }
  constructor() {
    this.apiBase = 'http://localhost:5000/api';
    this.paymentChart = null;
  }


  async fetchCompartments() {
    try {
      const res = await fetch(`${this.apiBase}/compartments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching compartments:', err);
      return [];
    }
  }

  async fetchPayments() {
    try {
      const res = await fetch(`${this.apiBase}/payments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching payments:', err);
      return [];
    }
  }

  async fetchTime() {
    try {
      const res = await fetch(`${this.apiBase}/time`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.success ? new Date(data.now) : new Date();
    } catch (err) {
      console.error('Error fetching server time:', err);
      return new Date();
    }
  }

  calculatePaymentMetrics(compartments, payments) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const metrics = {
      totalCompartments: compartments.length,
      totalCollected: 0,
      paid: 0,
      overpaid: 0,
      overdue: 0,
      partial: 0,
      none: 0,
      dueThisWeek: 0,
      occupancyRate: 0,
      vacant: 0
    };

    // Count occupied/vacant compartments for occupancy
    const occupied = compartments.filter(c => c.status === 'occupied' || c.tenant).length;
    metrics.occupancyRate = Math.round((occupied / compartments.length) * 100) || 0;
    metrics.vacant = compartments.length - occupied;

    // Analyze payments by compartment
    compartments.forEach(compartment => {
      if (!compartment.tenant || compartment.status === 'vacant') {
        metrics.none++;
        return;
      }
      const tenantId = compartment.tenant._id || compartment.tenant;
      // Match both tenant and tenantId fields for all payment records
      const thisMonthPayments = payments.filter(p => {
        const pDate = new Date(p.dueDate);
        const match = (p.tenant === tenantId || (p.tenant && p.tenant._id === tenantId) ||
                      p.tenantId === tenantId || (p.tenantId && p.tenantId._id === tenantId));
        return match && pDate >= thisMonth && pDate < nextMonth;
      });
      const rent = compartment.rentAmount || 0;
      const paidAmount = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (thisMonthPayments.length === 0) {
        metrics.none++;
      } else if (thisMonthPayments.some(p => p.status === 'overdue')) {
        metrics.overdue++;
      } else if (thisMonthPayments.some(p => p.status === 'partial')) {
        metrics.partial++;
        metrics.totalCollected += paidAmount;
      } else if (thisMonthPayments.some(p => p.status === 'paid')) {
        if (paidAmount > rent) {
          metrics.overpaid++;
        } else {
          metrics.paid++;
        }
        metrics.totalCollected += paidAmount;
      } else {
        metrics.none++;
      }
      // Check if due this week
      thisMonthPayments.forEach(payment => {
        const dueDate = new Date(payment.dueDate);
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (dueDate <= oneWeekFromNow && dueDate >= now && payment.status !== 'paid') {
          metrics.dueThisWeek++;
        }
      });
    });

    return metrics;
  }

  updateDashboardUI(metrics) {
    // Update welcome/stat cards
    document.getElementById('totalCompartments').textContent = metrics.totalCompartments;
    document.getElementById('occupancyRate').textContent = metrics.occupancyRate;
    document.getElementById('dueThisWeek').textContent = metrics.dueThisWeek;
    document.getElementById('cardTotalCompartments').textContent = metrics.totalCompartments;
    document.getElementById('cardCompartmentPercent').textContent = '100';

    // Vacant compartments
    const vacantEl = document.getElementById('vacantCompartmentsCount');
    if (vacantEl) {
      vacantEl.textContent = metrics.vacant;
    }

    // Payment summary cards (compartments.html IDs)
    const paidEl = document.getElementById('paymentSummaryPaid');
    if (paidEl) paidEl.textContent = metrics.paid;
    const overdueEl = document.getElementById('paymentSummaryOverdue');
    if (overdueEl) overdueEl.textContent = metrics.overdue;
    const partialEl = document.getElementById('paymentSummaryPartial');
    if (partialEl) partialEl.textContent = metrics.partial;
    // Optionally update 'none' as 'due' or 'pending' if needed

    // Monthly collected
    const monthlyCollectedEl = document.getElementById('monthlyCollected');
    if (monthlyCollectedEl) {
      monthlyCollectedEl.textContent = `$${metrics.totalCollected.toFixed(2)}`;
    }

    const collectionPercentEl = document.getElementById('collectionPercent');
    if (collectionPercentEl) {
      const expectedTotal = metrics.totalCompartments * 1500; // Assume avg rent
      const percent = expectedTotal > 0 ? Math.round((metrics.totalCollected / expectedTotal) * 100) : 0;
      collectionPercentEl.textContent = percent;
    }

    // Update chart
    this.updatePaymentChart(metrics);
  }

  updatePaymentChart(metrics) {
    const labels = ['Paid', 'Overpaid', 'Overdue', 'Partial', 'Pending'];
    const data = [metrics.paid, metrics.overpaid, metrics.overdue, metrics.partial, metrics.none];
    const colors = ['#28a745', '#007bff', '#dc3545', '#ffc107', '#6c757d'];

    const ctxEl = document.getElementById('paymentStatusChart');
    if (!ctxEl) return;

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const ctx = ctxEl.getContext('2d');
    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tenants by Payment Status',
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }

  async loadDashboard() {
    try {
      // Fetch compartments, payments, and summary in parallel
      const [compartments, payments, summary] = await Promise.all([
        this.fetchCompartments(),
        this.fetchPayments(),
        this.fetchPaymentSummary()
      ]);

      // Use backend summary for payment cards if available
      if (summary) {
        this.updateDashboardUIWithSummary(summary);
      } else {
        const metrics = this.calculatePaymentMetrics(compartments, payments);
        this.updateDashboardUI(metrics);
      }
      this.renderCompartmentsTable(compartments, payments);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize dashboard
  const dashboard = new DashboardDataManager();
  dashboard.loadDashboard();

  // Refresh button
  const refreshBtn = document.getElementById('refreshPaymentReport');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      dashboard.loadDashboard();
    });
  }

  // Auto-refresh every 30 seconds
  setInterval(() => {
    dashboard.loadDashboard();
  }, 30000);
});
