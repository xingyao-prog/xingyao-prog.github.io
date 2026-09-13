const choices = {
  extension: {
    changeTitle: "Deadline + 48 hours",
    changeCopy: "The submission date changes. The project criteria do not.",
    recoveryTitle: "Protect the process",
    recoveryCopy: "Constraint → extension → revised plan",
    receiptTitle: "Extension used",
    receiptCopy: "The student returns to the same project outcome.",
    principle: "Timing adapts. The learning destination stays fixed."
  },
  revision: {
    changeTitle: "One revised submission",
    changeCopy: "The student applies feedback against the same criteria.",
    recoveryTitle: "Learn through redesign",
    recoveryCopy: "First version → feedback → stronger version",
    receiptTitle: "Revision used",
    receiptCopy: "The student leaves with evidence of improvement.",
    principle: "Recovery becomes part of learning—not an exception to it."
  },
  reassessment: {
    changeTitle: "One additional attempt",
    changeCopy: "The attempt changes. The competency threshold does not.",
    recoveryTitle: "Try again with evidence",
    recoveryCopy: "Gap → preparation → reassessment",
    receiptTitle: "Reassessment used",
    receiptCopy: "A new attempt must still demonstrate the same outcome.",
    principle: "The route changes without lowering the standard."
  }
};

const buttons = Array.from(document.querySelectorAll("[data-choice]"));
const tokens = Array.from(document.querySelectorAll("[data-token]"));
const remaining = document.querySelector("[data-remaining]");
const reset = document.querySelector("[data-reset]");
const principle = document.querySelector("[data-principle]");
const flowCards = Array.from(document.querySelectorAll(".system-flow article"));

function selectedChoices() {
  return buttons.filter((button) => button.getAttribute("aria-pressed") === "true");
}

function showChoice(key) {
  const choice = choices[key];
  document.querySelector("[data-change-title]").textContent = choice.changeTitle;
  document.querySelector("[data-change-copy]").textContent = choice.changeCopy;
  document.querySelector("[data-recovery-title]").textContent = choice.recoveryTitle;
  document.querySelector("[data-recovery-copy]").textContent = choice.recoveryCopy;
  document.querySelector("[data-receipt-title]").textContent = choice.receiptTitle;
  document.querySelector("[data-receipt-copy]").textContent = choice.receiptCopy;
  principle.textContent = choice.principle;

  flowCards.forEach((card) => {
    card.classList.remove("pulse");
    requestAnimationFrame(() => card.classList.add("pulse"));
  });
}

function updateBudget(lastKey) {
  const selected = selectedChoices();
  tokens.forEach((token, index) => token.classList.toggle("spent", index < selected.length));
  remaining.textContent = `${tokens.length - selected.length} remain`;
  reset.hidden = selected.length === 0;

  if (lastKey) {
    showChoice(lastKey);
  } else if (selected.length) {
    showChoice(selected[selected.length - 1].dataset.choice);
  } else {
    document.querySelector("[data-change-title]").textContent = "Select a moment";
    document.querySelector("[data-change-copy]").textContent = "One clear choice updates the plan.";
    document.querySelector("[data-recovery-title]").textContent = "Path can adapt";
    document.querySelector("[data-recovery-copy]").textContent = "Constraint → choice → new plan";
    document.querySelector("[data-receipt-title]").textContent = "Standard unchanged";
    document.querySelector("[data-receipt-copy]").textContent = "Learning remains the destination.";
    principle.textContent = "Flexibility is available before anyone needs to ask for an exception.";
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const isSelected = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isSelected));
    updateBudget(isSelected ? null : button.dataset.choice);
  });
});

reset.addEventListener("click", () => {
  buttons.forEach((button) => button.setAttribute("aria-pressed", "false"));
  updateBudget(null);
});
