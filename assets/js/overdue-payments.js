// This script fetches overdue payments and updates the overdue payments table dynamically

document.addEventListener('DOMContentLoaded', function () {
  fetchOverduePayments();
  const massReminderBtn = document.querySelector('button.btn-danger.me-2, button.btn.btn-danger.me-2');
  if (massReminderBtn) {
    massReminderBtn.addEventListener('click', sendMassReminder);
  }
});

function sendMassReminder() {
  if (!confirm('Send reminder emails to ALL overdue tenants?')) return;
  fetch('/api/payments/send-mass-reminder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert('Reminders sent to all overdue tenants!');
      } else {
        alert('Failed to send reminders: ' + (result.message || 'Unknown error'));
      }
    })
    .catch(err => {
      alert('Error sending reminders: ' + err.message);
    });
}
function fetchOverduePayments() {
  fetch('/api/payments?status=overdue')
    .then(response => response.json())
    .then(result => {
      if (!result.success) throw new Error(result.message || 'Failed to fetch overdue payments');
      renderOverduePayments(result.data);
    })
    .catch(err => {
      console.error('Error fetching overdue payments:', err);
      renderOverduePayments([]);
    });
}

function renderOverduePayments(payments) {
  const tbody = document.querySelector('table.table tbody');
  tbody.innerHTML = '';

  let totalOverdue = 0;
  let overdueCount = 0;

  payments.forEach(payment => {
    const tenant = payment.tenant || {};
    const compartment = payment.compartment || {};
    const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
    const today = new Date();
    const daysOverdue = dueDate ? Math.max(Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)), 0) : '';
    const lateFee = payment.amount ? Math.round(payment.amount * 0.1) : 0;
    const rowClass = daysOverdue >= 21 ? 'table-danger' : 'table-warning';
    totalOverdue += payment.amount || 0;
    overdueCount++;

    tbody.innerHTML += `
      <tr class="${rowClass}">
        <td><strong>${tenant.firstName || ''} ${tenant.lastName || ''}</strong><br><small>${tenant.email || ''}</small><br><small class="text-danger">Ph: ${tenant.phone || ''}</small></td>
        <td>${compartment.name || payment.compartmentNumber || ''}</td>
        <td><strong>$${payment.amount?.toLocaleString() || ''}</strong></td>
        <td>${dueDate ? dueDate.toISOString().slice(0, 10) : ''}</td>
        <td><span class="badge ${rowClass === 'table-danger' ? 'bg-danger' : 'bg-warning'}">${daysOverdue} days</span></td>
        <td class="${rowClass === 'table-danger' ? 'text-danger' : 'text-warning'}"><strong>+$${lateFee}</strong></td>
        <td>
          <button class="btn btn-sm ${rowClass === 'table-danger' ? 'btn-danger' : 'btn-warning'}"><i class="bx bx-bell"></i> ${rowClass === 'table-danger' ? 'Final Notice' : 'Send Reminder'}</button>
          <button class="btn btn-sm btn-outline-success"><i class="bx bx-check"></i> Mark Paid</button>
        </td>
      </tr>
    `;
  });

  // Update alert summary
  document.querySelector('.alert-heading').innerHTML = `<i class="bx bx-error-circle me-2"></i>Urgent: ${overdueCount} Overdue Payment${overdueCount !== 1 ? 's' : ''}`;
  document.querySelector('.alert-danger strong').textContent = `$${totalOverdue.toLocaleString()}`;
}
