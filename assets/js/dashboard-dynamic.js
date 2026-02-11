// Dashboard Data Manager
class DashboardDataManager {
  constructor() {
    this.apiBase = 'http://localhost:5000/api';
    this.paymentChart = null;
  }

  async fetchTenants() {
    try {
      const res = await fetch(`${this.apiBase}/tenants`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching tenants:', err);
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

  calculatePaymentMetrics(tenants, payments) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const metrics = {
      totalCompartments: tenants.length,
      totalCollected: 0,
      paid: 0,
      overpaid: 0,
      overdue: 0,
      partial: 0,
      none: 0,
      dueThisWeek: 0,
      occupancyRate: 0
    };

    // Count active tenants for occupancy
    metrics.occupancyRate = Math.round((tenants.filter(t => t.status === 'active').length / tenants.length) * 100) || 0;

    // Analyze payments
    tenants.forEach(tenant => {
      const tenantPayments = payments.filter(p => p.tenant === tenant._id || p.tenant._id === tenant._id);
      
      // Filter payments for this month
      const thisMonthPayments = tenantPayments.filter(p => {
        const pDate = new Date(p.dueDate);
        return pDate >= thisMonth && pDate < nextMonth;
      });

      if (thisMonthPayments.length === 0) {
        metrics.none++;
      } else {
        thisMonthPayments.forEach(payment => {
          const rent = tenant.rentAmount || 0;
          const amount = payment.amount || 0;

          if (payment.status === 'paid') {
            if (amount > rent) {
              metrics.overpaid++;
            } else {
              metrics.paid++;
            }
            metrics.totalCollected += amount;
          } else if (payment.status === 'partial') {
            metrics.partial++;
            metrics.totalCollected += amount;
          } else if (payment.status === 'overdue') {
            metrics.overdue++;
          } else {
            metrics.none++;
          }

          // Check if due this week
          const dueDate = new Date(payment.dueDate);
          const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (dueDate <= oneWeekFromNow && dueDate >= now && payment.status !== 'paid') {
            metrics.dueThisWeek++;
          }
        });
      }
    });

    return metrics;
  }

  updateDashboardUI(metrics) {
    // Update welcome card
    document.getElementById('totalCompartments').textContent = metrics.totalCompartments;
    document.getElementById('occupancyRate').textContent = metrics.occupancyRate;
    document.getElementById('dueThisWeek').textContent = metrics.dueThisWeek;

    // Update stat cards
    document.getElementById('cardTotalCompartments').textContent = metrics.totalCompartments;
    document.getElementById('cardCompartmentPercent').textContent = '100';

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

    // Update payment summary
    document.getElementById('summaryPaid').textContent = metrics.paid;
    document.getElementById('summaryOverpaid').textContent = metrics.overpaid;
    document.getElementById('summaryOverdue').textContent = metrics.overdue;
    document.getElementById('summaryPartial').textContent = metrics.partial;
    document.getElementById('summaryNone').textContent = metrics.none;

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
      const [tenants, payments] = await Promise.all([
        this.fetchTenants(),
        this.fetchPayments()
      ]);

      const metrics = this.calculatePaymentMetrics(tenants, payments);
      this.updateDashboardUI(metrics);
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
