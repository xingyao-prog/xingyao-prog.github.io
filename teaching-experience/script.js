const projectData = {
  inclumap: {
    name: "IncluMap",
    now: "Read a place → map inclusion → redesign access",
    artifact: "Experience map",
    lasts: "A trace of how the student observed, interpreted, and redesigned an experience."
  },
  wearables: {
    name: "Wearables",
    now: "Collect signals → interpret in context → redesign a moment",
    artifact: "Measurement brief",
    lasts: "Evidence of using data carefully to inform an experience decision."
  },
  flow: {
    name: "Event Flow",
    now: "Observe movement → locate friction → redesign event flow",
    artifact: "Flow analysis",
    lasts: "A professional example of turning observation into an operational redesign."
  }
};

const footer = document.querySelector("footer");
const branchTriggers = document.querySelectorAll(".branch-trigger");

function updateFooter() {
  footer.hidden = !Array.from(branchTriggers).some((trigger) => trigger.getAttribute("aria-expanded") === "true");
}

branchTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!expanded));
    document.getElementById(trigger.getAttribute("aria-controls")).hidden = expanded;
    updateFooter();
  });
});

document.querySelectorAll(".idea-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const expanded = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!expanded));
    document.getElementById(trigger.getAttribute("aria-controls")).hidden = expanded;

    if (!expanded) {
      const next = trigger.parentElement.querySelector(".locked-next");
      if (next && next === trigger.nextElementSibling.nextElementSibling) next.hidden = false;
    }
  });
});

document.querySelectorAll("[data-project]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.project;
    const project = projectData[key];

    document.querySelectorAll("[data-project]").forEach((peer) => {
      const active = peer.dataset.project === key;
      peer.classList.toggle("active", active);
      peer.setAttribute("aria-pressed", String(active));
    });

    document.querySelector("[data-now-project]").textContent = project.now;
    document.querySelector("[data-trace-project]").textContent = project.name;
    document.querySelector("[data-trace-artifact]").textContent = project.artifact;
    document.querySelector("[data-lasts-project]").textContent = project.lasts;
  });
});

const creditButtons = Array.from(document.querySelectorAll("[data-credit-choice]"));
const credits = Array.from(document.querySelectorAll("[data-credit]"));
const creditCount = document.querySelector("[data-credit-count]");
const creditResult = document.querySelector("[data-credit-result]");

creditButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!selected));

    const choices = creditButtons.filter((peer) => peer.getAttribute("aria-pressed") === "true");
    credits.forEach((credit, index) => credit.classList.toggle("spent", index < choices.length));
    creditCount.textContent = `${credits.length - choices.length} remain`;
    creditResult.textContent = choices.length
      ? `${choices.map((choice) => choice.dataset.creditChoice).join(" + ")} selected. The same standards, with a flexible route.`
      : "Choose when flexibility matters most.";
  });
});
