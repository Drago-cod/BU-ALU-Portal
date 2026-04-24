const eventRegistrationLinks = document.querySelectorAll(".event-register-trigger");
const eventRegistrationForm = document.getElementById("event-registration-form-home");

function buildEventMeta(link) {
  return [
    link.dataset.eventDate,
    link.dataset.eventLocation,
    link.dataset.eventTime
  ].filter(Boolean).join(" - ");
}

function setSelectedEvent(link) {
  const title = link.dataset.eventTitle || "BU Alumni Event";
  const meta = buildEventMeta(link);
  const titleDisplay = document.getElementById("event-selected-title");
  const metaDisplay = document.getElementById("event-selected-meta");
  const titleInput = document.getElementById("event-registration-title");
  const metaInput = document.getElementById("event-registration-meta");

  if (titleDisplay) titleDisplay.textContent = title;
  if (metaDisplay) metaDisplay.textContent = meta;
  if (titleInput) titleInput.value = title;
  if (metaInput) metaInput.value = meta;
}

eventRegistrationLinks.forEach((link) => {
  link.addEventListener("click", () => setSelectedEvent(link));
});

if (eventRegistrationForm) {
  eventRegistrationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = eventRegistrationForm.elements["full-name"].value.trim();
    const email = eventRegistrationForm.elements["email"].value.trim();
    const phone = eventRegistrationForm.elements["phone"].value.trim();
    const eventTitle = eventRegistrationForm.elements["event-title"].value;
    const eventMeta = eventRegistrationForm.elements["event-meta"].value;
    const success = document.getElementById("event-registration-success");

    const registration = {
      fullName,
      email,
      phone,
      eventTitle,
      eventMeta,
      ticketReference: "BU-" + Date.now().toString().slice(-6),
      registeredAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem("buEventRegistrations") || "[]");
    existing.unshift(registration);
    localStorage.setItem("buEventRegistrations", JSON.stringify(existing));

    if (success) {
      success.textContent =
        "Registration received for " +
        eventTitle +
        ". Ticket reference " +
        registration.ticketReference +
        " has been prepared for " +
        fullName +
        ". We will use " +
        email +
        " and " +
        phone +
        " for ticket delivery and attendee follow-up.";
      success.hidden = false;
    }

    eventRegistrationForm.reset();
    const titleInput = document.getElementById("event-registration-title");
    const metaInput = document.getElementById("event-registration-meta");
    if (titleInput) titleInput.value = eventTitle;
    if (metaInput) metaInput.value = eventMeta;
  });
}
