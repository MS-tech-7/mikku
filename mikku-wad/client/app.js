let currentUser = null;

$(document).ready(function () {
  setTimeout(() => $('#loadingScreen').addClass('hide'), 900);
  checkSession();
  bindEvents();
});

function bindEvents() {
  $('.tab-btn').on('click', function () {
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    const tab = $(this).data('tab');
    $('#loginForm, #registerForm').addClass('hidden');
    $('#' + tab + 'Form').removeClass('hidden');
  });

  $('#loginForm').on('submit', login);
  $('#registerForm').on('submit', register);
  $('#logoutBtn').on('click', logout);
  $('#showServiceForm').on('click', () => $('#serviceFormCard').toggleClass('hidden'));
  $('#showTaskForm').on('click', () => $('#taskFormCard').toggleClass('hidden'));
  $('#serviceForm').on('submit', createService);
  $('#taskForm').on('submit', createTask);
  $('#serviceSearchBtn').on('click', loadServices);
  $('#taskSearchBtn').on('click', loadTasks);
  $('#profileForm').on('submit', saveProfile);

  $('.nav-btn, [data-section]').on('click', function () {
    const section = $(this).data('section');
    if (section) showSection(section);
  });

  $('#servicesList').on('click', '.offer-service-btn', function () {
    showToast('Service details can be expanded here in the next project phase.');
  });

  $('#tasksList').on('click', '.apply-btn', function () {
    const taskId = $(this).data('id');
    const box = $('#' + taskId.replaceAll(/[^a-zA-Z0-9]/g, ''));
    box.toggleClass('hidden');
  });

  $('#tasksList').on('submit', '.offer-form', submitOffer);
  $('#tasksList').on('click', '.accept-btn', acceptOffer);
  $('#tasksList').on('click', '.status-btn', updateTaskStatus);
}

function checkSession() {
  $.get('/api/auth/me')
    .done(data => enterApp(data.user))
    .fail(() => showAuth());
}

function login(e) {
  e.preventDefault();
  const payload = {
    username: $('#loginUsername').val(),
    password: $('#loginPassword').val()
  };
  api('/api/auth/login', 'POST', payload)
    .done(data => { enterApp(data.user); showToast('Welcome back to Mikku!'); })
    .fail(showError);
}

function register(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  api('/api/auth/register', 'POST', data)
    .done(data => { enterApp(data.user); showToast('Your Mikku account is ready!'); })
    .fail(showError);
}

function logout() {
  api('/api/auth/logout', 'POST', {})
    .always(() => {
      currentUser = null;
      $('#appView').addClass('hidden');
      showAuth();
      showToast('Logged out.');
    });
}

function enterApp(user) {
  currentUser = user;
  $('#authView').addClass('hidden');
  $('#appView').removeClass('hidden');
  $('#userBadge').text(`${user.name} · ${prettyRole(user.role)}`);
  $('#welcomeText').text(`Hi ${user.name.split(' ')[0]}, find your next opportunity.`);
  $('#statRole').text(prettyRole(user.role));
  loadServices();
  loadTasks();
  loadProfile();
  showSection('home');
}

function showAuth() {
  $('#authView').removeClass('hidden');
  $('#appView').addClass('hidden');
}

function showSection(section) {
  $('.page-section').addClass('hidden');
  $('#' + section + 'Section').removeClass('hidden');
  $('.nav-btn').removeClass('active');
  $(`.nav-btn[data-section="${section}"]`).addClass('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadServices() {
  const search = $('#serviceSearch').val() || '';
  const category = $('#serviceCategory').val() || '';
  $.get('/api/services', { search, category })
    .done(data => {
      $('#statServices').text(data.services.length);
      renderServices(data.services);
    })
    .fail(showError);
}

function renderServices(services) {
  if (!services.length) {
    $('#servicesList').html('<div class="form-card"><h3>No services found.</h3><p class="muted">Try another keyword or publish the first service.</p></div>');
    return;
  }
  let html = '';
  // jQuery .each() is intentionally used here as a syllabus demonstration.
  $.each(services, function (_, service) {
    const skills = (service.skills || []).map(s => `<span class="skill">${escapeHtml(s)}</span>`).join('');
    html += `
      <article class="service-card">
        <div class="card-top"><h3>${escapeHtml(service.title)}</h3><span class="category-pill">${escapeHtml(service.category)}</span></div>
        <p class="card-description">${escapeHtml(service.description)}</p>
        <div class="skill-list">${skills}</div>
        <div class="card-footer"><div><div class="price">₹${service.price}</div><div class="user-small">by ${escapeHtml(service.owner?.name || 'Mikku user')}</div></div><button class="secondary-btn offer-service-btn">View</button></div>
      </article>`;
  });
  $('#servicesList').html(html);
}

function createService(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.price = Number(data.price);
  data.skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  api('/api/services', 'POST', data)
    .done(data => { e.target.reset(); $('#serviceFormCard').addClass('hidden'); loadServices(); showToast(data.message); })
    .fail(showError);
}

function loadTasks() {
  const search = $('#taskSearch').val() || '';
  const category = $('#taskCategory').val() || '';
  $.get('/api/tasks', { search, category })
    .done(data => {
      $('#statTasks').text(data.tasks.filter(t => t.status === 'open').length);
      renderTasks(data.tasks);
    })
    .fail(showError);
}

function renderTasks(tasks) {
  if (!tasks.length) {
    $('#tasksList').html('<div class="form-card"><h3>No tasks found.</h3><p class="muted">Post a task and create an opportunity.</p></div>');
    return;
  }
  let html = '';
  $.each(tasks, function (_, task) {
    const date = new Date(task.deadline).toLocaleDateString();
    const mine = task.owner?._id === currentUser?.id || task.owner?._id?.toString() === currentUser?.id?.toString();
    const applyBoxId = `offer-${task._id}`.replaceAll(/[^a-zA-Z0-9]/g, '');
    const offers = task.offers || [];
    const offersHtml = mine && offers.length ? offers.map(o => `
      <div class="offer-box"><b>${escapeHtml(o.applicant?.name || 'Applicant')}</b><p>${escapeHtml(o.message || '')}</p><div class="card-footer"><span>₹${o.amount} · ${o.status}</span>${o.status === 'pending' && task.status === 'open' ? `<button class="primary-btn accept-btn" data-task="${task._id}" data-offer="${o._id}">Accept</button>` : ''}</div></div>`).join('') : '';
    const applyButton = !mine && task.status === 'open' ? `<button class="secondary-btn apply-btn" data-id="${task._id}">Apply</button>` : '';
    const progressButton = (task.assignedTo?._id === currentUser?.id || task.assignedTo?._id?.toString() === currentUser?.id?.toString() || mine) && task.status !== 'completed'
      ? `<button class="ghost-btn status-btn" data-id="${task._id}" data-next="${nextStatus(task.status)}">→ ${nextStatusLabel(task.status)}</button>` : '';
    html += `
      <article class="task-card">
        <div class="card-top"><h3>${escapeHtml(task.title)}</h3><span class="category-pill">${escapeHtml(task.category)}</span></div>
        <p class="card-description">${escapeHtml(task.description)}</p>
        <div class="dashboard-grid" style="grid-template-columns:1fr 1fr; margin-top:10px;"><div><small class="muted">Budget</small><div class="price">₹${task.budget}</div></div><div><small class="muted">Deadline</small><div><b>${date}</b></div></div></div>
        <div class="card-footer"><div><div class="status ${task.status}">${task.status.replace('_',' ')}</div><div class="user-small">posted by ${escapeHtml(task.owner?.name || 'Mikku user')}</div></div><div>${applyButton}${progressButton}</div></div>
        <div id="${applyBoxId}" class="offer-box hidden">
          <form class="offer-form" data-id="${task._id}">
            <label>Your offer amount ₹<input name="amount" type="number" min="0" required value="${task.budget}"></label>
            <label>Message<textarea name="message" rows="2" placeholder="Tell the task owner how you will complete it."></textarea></label>
            <button class="primary-btn">Submit Offer</button>
          </form>
        </div>
        ${offersHtml}
      </article>`;
  });
  $('#tasksList').html(html);
}

function createTask(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.budget = Number(data.budget);
  api('/api/tasks', 'POST', data)
    .done(data => { e.target.reset(); $('#taskFormCard').addClass('hidden'); loadTasks(); showToast(data.message); })
    .fail(showError);
}

function submitOffer(e) {
  e.preventDefault();
  const taskId = $(e.currentTarget).data('id');
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  data.amount = Number(data.amount);
  api(`/api/tasks/${taskId}/offers`, 'POST', data)
    .done(data => { loadTasks(); showToast(data.message); })
    .fail(showError);
}

function acceptOffer() {
  const taskId = $(this).data('task');
  const offerId = $(this).data('offer');
  api(`/api/tasks/${taskId}/offers/${offerId}/accept`, 'POST', {})
    .done(data => { loadTasks(); showToast(data.message); })
    .fail(showError);
}

function updateTaskStatus() {
  const taskId = $(this).data('id');
  const next = $(this).data('next');
  api(`/api/tasks/${taskId}/status`, 'POST', { status: next })
    .done(data => { loadTasks(); showToast(data.message); })
    .fail(showError);
}

function nextStatus(status) {
  if (status === 'assigned') return 'in_progress';
  if (status === 'in_progress') return 'completed';
  return status;
}
function nextStatusLabel(status) { return status === 'assigned' ? 'Start Work' : 'Mark Completed'; }

function loadProfile() {
  $.get('/api/users/profile')
    .done(data => fillProfile(data.user))
    .fail(showError);
}

function fillProfile(user) {
  $('#profileAvatar').text((user.name || 'M').charAt(0).toUpperCase());
  $('#profileName').text(user.name);
  $('#profileRole').text(prettyRole(user.role));
  $('#profileUsername').text(user.username);
  $('#profilePhone').text(user.phone);
  $('#profileId').text(user.idCard);
  $('#profileNameInput').val(user.name);
  $('#profileDepartment').val(user.department || '');
  $('#profileYear').val(user.year || '');
  $('#profileBio').val(user.bio || '');
  $('#profileSkills').val((user.skills || []).join(', '));
}

function saveProfile(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  api('/api/users/profile', 'PUT', data)
    .done(data => { currentUser = { ...currentUser, ...data.user }; fillProfile(data.user); $('#userBadge').text(`${data.user.name} · ${prettyRole(data.user.role)}`); showToast(data.message); })
    .fail(showError);
}

function api(url, method, data) {
  return $.ajax({ url, method, contentType: 'application/json', data: JSON.stringify(data) });
}

function prettyRole(role) {
  return ({ student: 'Student', teacher: 'Teacher', society_head: 'Society Head' })[role] || role;
}
function showToast(message, error = false) {
  $('#toast').text(message).toggleClass('error', error).addClass('show');
  setTimeout(() => $('#toast').removeClass('show'), 2600);
}
function showError(xhr) {
  const msg = xhr?.responseJSON?.message || 'Something went wrong. Check the server and try again.';
  showToast(msg, true);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}
