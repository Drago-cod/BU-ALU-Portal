const eventRegistrationTriggers = document.querySelectorAll("[data-event-register]");

if (eventRegistrationTriggers.length) {
  const modal = document.createElement("div");
  modal.className = "event-registration-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="event-registration-backdrop" data-event-close></div>
    <div class="event-registration-dialog" role="dialog" aria-modal="true" aria-labelledby="event-registration-title">
      <button class="event-registration-close" type="button" aria-label="Close registration form" data-event-close>&times;</button>
      <div class="event-registration-layout">
        <div class="event-registration-intro">
          <p class="eyebrow">Event Registration</p>
          <h2 id="event-registration-title">Reserve your seat</h2>
          <p class="event-registration-copy">
            Share your personal information so the team can prepare your ticket and contact you with final event details.
          </p>
          <div class="event-registration-summary">
            <p class="event-registration-summary-label">Selected event</p>
            <h3 id="event-registration-name">Annual Alumni Gala 2026</h3>
            <p class="meta" id="event-registration-meta">May 10, 2026 - Kampala Serena Hotel - 6:00 PM EAT</p>
          </div>
        </div>
        <form class="portal-form portal-form--event" id="event-registration-form">
          <input type="hidden" name="event-title" id="event-title-hidden" />
          <input type="hidden" name="event-meta" id="event-meta-hidden" />
          <div class="form-row">
            <div class="form-group">
              <label for="event-full-name">Full Name</label>
              <input type="text" id="event-full-name" name="full-name" placeholder="Your full name" required />
            </div>
            <div class="form-group">
              <label for="event-email">Email Address</label>
              <input type="email" id="event-email" name="email" placeholder="you@example.com" required />
            </div>
          </div>
          <div class="form-group">
            <label for="event-phone">Phone Number</label>
            <input type="tel" id="event-phone" name="phone" placeholder="+256 7XX XXX XXX" required />
          </div>
          <p class="event-registration-note">Used for sending the ticket and contacting the attendee.</p>
          <button class="btn btn-primary" type="submit">Complete Registration</button>
          <div class="event-registration-feedback" id="event-registration-feedback" hidden></div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const dialog = modal.querySelector(".event-registration-dialog");
  const form = modal.querySelector("#event-registration-form");
  const feedback = modal.querySelector("#event-registration-feedback");
  const titleEl = modal.querySelector("#event-registration-name");
  const metaEl = modal.querySelector("#event-registration-meta");
  const titleHidden = modal.querySelector("#event-title-hidden");
  const metaHidden = modal.querySelector("#event-meta-hidden");
  const firstInput = modal.querySelector("#event-full-name");
  let lastTrigger = null;

  function eventMetaFromTrigger(trigger) {
    const parts = [
      trigger.dataset.eventDate,
      trigger.dataset.eventLocation,
      trigger.dataset.eventTime
    ].filter(Boolean);

    return parts.join(" - ");
  }

  function openEventRegistration(trigger) {
    lastTrigger = trigger;
    const title = trigger.dataset.eventTitle || "BU Alumni Event";
    const meta = eventMetaFromTrigger(trigger);

    titleEl.textContent = title;
    metaEl.textContent = meta;
    titleHidden.value = title;
    metaHidden.value = meta;
    feedback.hidden = true;
    feedback.textContent = "";
    form.reset();

    modal.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => firstInput.focus());
  }

  function closeEventRegistration() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    form.reset();
    feedback.hidden = true;
    feedback.textContent = "";
    if (lastTrigger) lastTrigger.focus();
  }

  eventRegistrationTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openEventRegistration(trigger));
  });

  modal.querySelectorAll("[data-event-close]").forEach((element) => {
    element.addEventListener("click", closeEventRegistration);
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") {
      closeEventRegistration();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const registration = {
      eventTitle: titleHidden.value,
      eventMeta: metaHidden.value,
      fullName: form.elements["full-name"].value.trim(),
      email: form.elements["email"].value.trim(),
      phone: form.elements["phone"].value.trim(),
      ticketId: "BU-" + Date.now().toString().slice(-6),
      registeredAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("buEventRegistrations") || "[]");
    existing.unshift(registration);
    localStorage.setItem("buEventRegistrations", JSON.stringify(existing));

    feedback.innerHTML =
      "<strong>Registration received.</strong> Ticket reference <strong>" +
      registration.ticketId +
      "</strong> has been prepared for " +
      registration.fullName +
      ". We will use " +
      registration.email +
      " and " +
      registration.phone +
      " for ticket delivery and attendee follow-up.";
    feedback.hidden = false;
    form.reset();
  });
}
